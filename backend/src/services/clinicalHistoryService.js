const {
  Team,
  User,
  Address,
  TeamSurgery,
  Surgery,
  GravidanceType,
  ThematicArea,
  Screening,
  Question,
  TeamReply,
  ProtocolRule,
  Municipality
} = require('../models');
const { Op } = require('sequelize');

/**
 * Clinical History Service
 * Handles all operations related to user clinical history
 * Migrated from TeamServiceImpl.java
 */
class ClinicalHistoryService {

  /**
   * Get complete consumer details including all clinical data
   * @param {number} teamId - Consumer team ID
   * @returns {Promise<Object>} Complete consumer data
   */
  async getConsumerDetails(teamId) {
    try {
      const consumer = await Team.findByPk(teamId, {
        include: [
          {
            model: User,
            as: 'representative',
            include: [
              {
                model: GravidanceType,
                as: 'gravidanceTypes',
                required: false
              },
              {
                model: Municipality,
                as: 'birthPlace',
                required: false
              }
            ]
          },
          {
            model: Address,
            as: 'address'
          }
        ]
      });

      if (!consumer) {
        throw new Error('Consumer not found');
      }

      return consumer;
    } catch (error) {
      console.error('Error fetching consumer details:', error);
      throw error;
    }
  }

  /**
   * Get all surgeries for a team
   * If no surgeries exist, initialize them with default root surgeries
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} List of team surgeries with children
   */
  async getTeamSurgeries(teamId) {
    try {
      let surgeries = await TeamSurgery.findAll({
        where: { teamId },
        include: [
          {
            model: Surgery,
            as: 'surgery'
          }
        ],
        order: [['id', 'ASC']]
      });

      // If no surgeries exist, initialize with defaults
      if (surgeries.length === 0) {
        surgeries = await this.initializeTeamSurgeries(teamId);
      }

      // Organize surgeries into parent-child structure
      return this.organizeSurgeriesWithChildren(surgeries);
    } catch (error) {
      console.error('Error fetching team surgeries:', error);
      throw error;
    }
  }

  /**
   * Initialize default surgeries for a team
   * Creates team_surgery records for all surgeries (root and children)
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} Created team surgeries
   */
  async initializeTeamSurgeries(teamId) {
    try {
      // Get all surgeries (both root and children)
      const allSurgeries = await Surgery.findAll({
        where: { deleted: false },
        order: [['id', 'ASC']]
      });

      const now = new Date();
      const createdSurgeries = [];

      for (const surgery of allSurgeries) {
        const teamSurgery = await TeamSurgery.create({
          teamId,
          surgeryId: surgery.id,
          executed: false,
          deleted: false,
          insertionDate: now
        });

        // Reload with surgery association
        await teamSurgery.reload({
          include: [{ model: Surgery, as: 'surgery' }]
        });

        createdSurgeries.push(teamSurgery);
      }

      return createdSurgeries;
    } catch (error) {
      console.error('Error initializing team surgeries:', error);
      throw error;
    }
  }

  /**
   * Organize flat surgeries list into parent-child structure
   * @param {Array} surgeries - Flat list of team surgeries
   * @returns {Array} Organized surgeries with children
   */
  organizeSurgeriesWithChildren(surgeries) {
    // Separate root surgeries and children
    const rootSurgeries = surgeries.filter(s => !s.surgery?.rootId);
    const childSurgeries = surgeries.filter(s => s.surgery?.rootId);

    // Attach children to their parents
    return rootSurgeries.map(root => {
      const children = childSurgeries.filter(
        child => child.surgery?.rootId === root.surgery?.id
      );
      return {
        ...root.toJSON(),
        children: children.map(c => c.toJSON())
      };
    });
  }

  /**
   * Save or update team surgeries
   * @param {Array} surgeries - Array of surgery objects
   * @param {string} username - Username for audit
   * @returns {Promise<Array>} Saved surgeries
   */
  async saveSurgeries(surgeries, username) {
    try {
      const savedSurgeries = [];
      const now = new Date();

      for (const surgery of surgeries) {
        if (surgery.id) {
          // Update existing
          surgery.lastModifyDate = now;
          surgery.lastModifyUsername = username;
          await TeamSurgery.update(surgery, {
            where: { id: surgery.id }
          });
          savedSurgeries.push(surgery);
        } else {
          // Create new
          surgery.insertionDate = now;
          surgery.insertionUsername = username;
          const newSurgery = await TeamSurgery.create(surgery);
          savedSurgeries.push(newSurgery);
        }
      }

      return savedSurgeries;
    } catch (error) {
      console.error('Error saving surgeries:', error);
      throw error;
    }
  }

  /**
   * Get screening data for thematic areas with replies
   * Migrated from downloadConsumerDetails() in TeamServiceImpl.java
   * @param {number} teamId - Team ID
   * @param {Array} thematicAreaIds - Array of thematic area IDs (optional)
   * @returns {Promise<Array>} Thematic areas with screening data
   */
  async getScreeningDataForThematicAreas(teamId, thematicAreaIds = null) {
    try {
      // Load questions through ProtocolRule (like Java legacy)
      // Questions are not directly associated to ThematicArea - they're linked via ProtocolRule
      const protocolRules = await ProtocolRule.findAll({
        where: {
          deleted: false
        },
        include: [
          {
            model: ThematicArea,
            as: 'thematic_area',
            required: true,
            where: thematicAreaIds ? { id: { [Op.in]: thematicAreaIds } } : {}
          },
          {
            model: Question,
            as: 'question',
            required: true
          }
        ],
        order: [
          [{ model: ThematicArea, as: 'thematic_area' }, 'id', 'ASC']
        ]
      });

      // Group questions by thematic area (like Java setScreening_questions)
      const thematicAreaMap = new Map();

      for (const pr of protocolRules) {
        const ta = pr.thematic_area;
        if (!ta) continue;

        if (!thematicAreaMap.has(ta.id)) {
          thematicAreaMap.set(ta.id, {
            id: ta.id,
            label: ta.label,
            deleted: ta.deleted,
            screening_questions: [],
            screening: null
          });
        }

        const taData = thematicAreaMap.get(ta.id);
        const question = pr.question;

        // Avoid duplicate questions
        if (question && !taData.screening_questions.find(q => q.id === question.id)) {
          // Load the question with its sub_questions (self-reference)
          const questionWithSubs = await Question.findByPk(question.id, {
            include: [
              {
                model: Question,
                as: 'sub_questions',
                required: false
              },
              {
                model: ProtocolRule,
                as: 'protocol_rules',
                required: false
              }
            ]
          });

          // Build protocol_rules with sub_question attached
          const rulesWithSubQuestions = questionWithSubs.protocol_rules.map(rule => {
            const ruleJson = rule.toJSON();
            // If has_sub_question, attach the first sub_question of the parent question
            if (ruleJson.has_sub_question && questionWithSubs.sub_questions && questionWithSubs.sub_questions.length > 0) {
              // Find the matching sub-question (or use the first one)
              ruleJson.sub_question = questionWithSubs.sub_questions[0].toJSON();
            }
            return ruleJson;
          });

          taData.screening_questions.push({
            id: question.id,
            question: question.question,
            type_question: question.type_question,
            question_values: question.question_values,
            protocol_rules: rulesWithSubQuestions,
            given_answer: null,
            given_answer_string: null
          });
        }
      }

      // For each thematic area, get the most recent screening and replies
      for (const [taId, taData] of thematicAreaMap) {
        const screening = await Screening.findOne({
          where: {
            team_id: teamId,
            thematic_area_id: taId
          },
          order: [['insertion_date', 'DESC']],
          limit: 1
        });

        taData.screening = screening ? screening.toJSON() : null;

        if (screening) {
          // Get all replies for this screening
          const replies = await TeamReply.findAll({
            where: {
              screening_id: screening.id
            }
          });

          // Associate replies with questions
          for (const question of taData.screening_questions) {
            const reply = replies.find(r => r.question_id === question.id);
            if (reply) {
              question.given_answer = reply.reply;
              question.given_answer_string = reply.reply_string;
            }

            // Handle sub-questions
            if (question.protocol_rules) {
              for (const rule of question.protocol_rules) {
                if (rule.has_sub_question && rule.sub_question) {
                  const subReply = replies.find(r => r.question_id === rule.sub_question.id);
                  if (subReply) {
                    rule.sub_question.given_answer = subReply.reply;
                    rule.sub_question.given_answer_string = subReply.reply_string;
                  }
                }
              }
            }
          }
        }
      }

      return Array.from(thematicAreaMap.values());
    } catch (error) {
      console.error('Error fetching screening data:', error);
      throw error;
    }
  }

  /**
   * Update consumer form data
   * @param {number} teamId - Team ID
   * @param {Object} data - Updated consumer data
   * @param {string} username - Username for audit
   * @returns {Promise<Object>} Updated consumer
   */
  async updateConsumerForm(teamId, data, username) {
    try {
      const consumer = await Team.findByPk(teamId, {
        include: [
          {
            model: User,
            as: 'representative'
          },
          {
            model: Address,
            as: 'address'
          }
        ]
      });

      if (!consumer) {
        throw new Error('Consumer not found');
      }

      const now = new Date();

      // Update representative (user) data
      if (data.representative && consumer.representative) {
        const repData = { ...data.representative };
        repData.lastModifyDate = now;
        repData.lastModifyUsername = username;
        repData.filledPersonalForm = true;

        // Handle birthPlace - extract ID from object if sent as object
        if (repData.birthPlace && typeof repData.birthPlace === 'object') {
          repData.birthPlaceId = repData.birthPlace.id;
          delete repData.birthPlace;
        }

        await consumer.representative.update(repData);
      }

      // Update address data
      if (data.address) {
        const addressData = { ...data.address };

        // Handle municipality - extract name if sent as object
        if (addressData.municipality && typeof addressData.municipality === 'object') {
          addressData.municipality = addressData.municipality.name;
        }

        // Remove id if present (to avoid conflicts)
        delete addressData.id;

        if (consumer.address) {
          // Update existing address
          await consumer.address.update(addressData);
        } else {
          // Create new address and associate with team
          const newAddress = await Address.create(addressData);
          await consumer.update({ addressId: newAddress.id });
        }
      }

      // Update team data
      const teamData = {
        ...data.team,
        lastModifyDate: now,
        lastModifyUsername: username
      };
      delete teamData.id; // Don't update the primary key
      delete teamData.representative;
      delete teamData.address;

      await consumer.update(teamData);

      // Handle pregnancies
      if (data.gravidanceTypes !== undefined) {
        // Delete existing
        await GravidanceType.destroy({
          where: { userId: consumer.representativeId }
        });

        // Create new (only if there are pregnancies)
        if (data.gravidanceTypes && data.gravidanceTypes.length > 0) {
          for (let i = 0; i < data.gravidanceTypes.length; i++) {
            const gt = data.gravidanceTypes[i];
            await GravidanceType.create({
              userId: consumer.representativeId,
              seqGravidance: i + 1, // Sequence number starts from 1
              natur: gt.natur
            });
          }
        }
      }

      // Handle surgeries
      if (data.surgeries && Array.isArray(data.surgeries)) {
        for (const surgery of data.surgeries) {
          // Update parent surgery
          if (surgery.id) {
            await TeamSurgery.update({
              executed: surgery.executed,
              description: surgery.description || null,
              lastModifyDate: now,
              lastModifyUsername: username
            }, {
              where: { id: surgery.id }
            });
          }

          // Update children surgeries
          if (surgery.children && surgery.children.length > 0) {
            for (const child of surgery.children) {
              if (child.id) {
                await TeamSurgery.update({
                  executed: child.executed,
                  lastModifyDate: now,
                  lastModifyUsername: username
                }, {
                  where: { id: child.id }
                });
              }
            }
          }
        }
      }

      // Reload with fresh data
      await consumer.reload({
        include: [
          {
            model: User,
            as: 'representative',
            include: [
              {
                model: GravidanceType,
                as: 'gravidanceTypes'
              },
              {
                model: Municipality,
                as: 'birthPlace',
                required: false
              }
            ]
          },
          {
            model: Address,
            as: 'address'
          }
        ]
      });

      return consumer;
    } catch (error) {
      console.error('Error updating consumer form:', error);
      throw error;
    }
  }

  /**
   * Calculate pregnancy statistics (natural, cesarean, abortion counts)
   * @param {Array} gravidanceTypes - Array of gravidance type objects
   * @returns {Object} Counts by type
   */
  calculatePregnancyStats(gravidanceTypes) {
    const stats = {
      natural: 0,
      cesarean: 0,
      abortion: 0
    };

    for (const gt of gravidanceTypes) {
      switch (gt.natur) {
        case 'nat':
          stats.natural++;
          break;
        case 'cae':
          stats.cesarean++;
          break;
        case 'abo':
          stats.abortion++;
          break;
      }
    }

    return stats;
  }
}

module.exports = new ClinicalHistoryService();
