const {
  User,
  ThematicArea,
  Question,
  ProtocolRule,
  Protocol,
  ExaminationPathology,
  Screening,
  ScreeningResult,
  TeamReply,
  Team,
  sequelize
} = require('../models');
const { Op, QueryTypes } = require('sequelize');

/**
 * Get all thematic areas for screening choice
 */
exports.getThematicAreas = async (req, res) => {
  try {
    console.log('[QuestionnaireController] getThematicAreas - Start');

    const thematicAreas = await ThematicArea.findAll({
      where: {
        deleted: false
      },
      order: [['label', 'ASC']]
    });

    console.log(`[QuestionnaireController] Found ${thematicAreas.length} thematic areas`);

    res.json(thematicAreas);
  } catch (error) {
    console.error('[QuestionnaireController] Error getting thematic areas:', error);
    res.status(500).json({
      error: 'Errore nel caricamento delle aree tematiche',
      details: error.message
    });
  }
};

/**
 * Initialize screening questions based on screening type (age or thematic area)
 * REPLICA ESATTA del metodo intializeAdvancedScreening del legacy
 */
exports.initializeScreening = async (req, res) => {
  try {
    console.log('[QuestionnaireController] initializeScreening - Start');
    const { screeningType, userId } = req.body; // screeningType: -1 for age, >0 for thematic area id

    // Get user first (without teams to avoid Sequelize's automatic deleted handling)
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Fetch teams using raw SQL to avoid Sequelize's hardcoded "deleted = false" boolean conversion
    // The database column "deleted" is CHAR type with 'Y'/'N' values, but Sequelize forces boolean comparison
    const teamsQuery = `
      SELECT t.* FROM app_team t
      INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
      WHERE ut.app_user_id = :userId AND t.deleted = 'N'
      LIMIT 1
    `;

    const activeTeams = await sequelize.query(teamsQuery, {
      replacements: { userId: user.id },
      type: QueryTypes.SELECT
    });

    console.log(`[QuestionnaireController] Found ${activeTeams?.length || 0} active teams for user ${user.id} (${user.username})`);

    if (!activeTeams || activeTeams.length === 0) {
      console.log('[QuestionnaireController] ERROR: User has no associated teams');
      return res.status(400).json({
        error: 'Utente non associato a nessun team'
      });
    }

    const userTeam = activeTeams[0];

    // Build search criteria for ProtocolRule
    let searchCriteria = {
      deleted: false
    };

    // If screeningType == -1, filter by user's protocol (age-based)
    // If screeningType > 0, filter by thematic area
    if (screeningType === -1) {
      // Get user's protocol
      const protocol = await Protocol.findOne({
        where: {
          deleted: false
          // Add age-based logic here if needed
        }
      });

      if (protocol) {
        // Include both protocol-specific questions AND "Generali" area (id = -1)
        searchCriteria = {
          deleted: false,
          [Op.or]: [
            { protocol_id: protocol.id },
            { thematic_area_id: -1 }
          ]
        };
      }
    } else if (screeningType > 0) {
      searchCriteria.thematic_area_id = screeningType;
    }

    // Get all protocol rules with questions
    console.log('[QuestionnaireController] Searching protocol rules with criteria:', searchCriteria);

    const protocolRules = await ProtocolRule.findAll({
      where: searchCriteria,
      include: [
        {
          model: Question,
          as: 'question',
          where: { deleted: false },
          include: [
            {
              model: ProtocolRule,
              as: 'protocol_rules',
              where: { deleted: false },
              required: false,
              include: [
                {
                  model: ExaminationPathology,
                  as: 'examination',
                  required: false
                },
                {
                  model: Question,
                  as: 'question',
                  required: false,
                  include: [{
                    model: ProtocolRule,
                    as: 'protocol_rules',
                    where: { deleted: false },
                    required: false,
                    include: [{
                      model: ExaminationPathology,
                      as: 'examination',
                      required: false
                    }]
                  }]
                }
              ]
            },
            {
              model: Question,
              as: 'sub_questions',
              where: { deleted: false },
              required: false,
              include: [{
                model: ProtocolRule,
                as: 'protocol_rules',
                where: { deleted: false },
                required: false,
                include: [{
                  model: ExaminationPathology,
                  as: 'examination',
                  required: false
                }]
              }]
            }
          ]
        },
        {
          model: ThematicArea,
          as: 'thematic_area',
          where: { deleted: false },
          required: false
        },
        {
          model: Protocol,
          as: 'protocol',
          required: false
        }
      ],
      order: [['thematic_area_id', 'ASC']]
    });

    console.log(`[QuestionnaireController] Found ${protocolRules.length} protocol rules`);

    // Group questions by thematic area (REPLICA ESATTA logic)
    const thematicAreasMap = {};

    for (const pr of protocolRules) {
      if (!pr.question || !pr.thematic_area) continue;

      const taId = pr.thematic_area.id;

      if (!thematicAreasMap[taId]) {
        thematicAreasMap[taId] = {
          ...pr.thematic_area.toJSON(),
          screening_questions: []
        };
      }

      // Add question to thematic area if not already present
      const existingQuestion = thematicAreasMap[taId].screening_questions.find(
        q => q.id === pr.question.id
      );

      if (!existingQuestion) {
        const questionData = {
          ...pr.question.toJSON(),
          given_answer: null,
          given_answer_string: null
        };

        // Include sub_questions if they exist
        if (pr.question.sub_questions && pr.question.sub_questions.length > 0) {
          questionData.sub_questions = pr.question.sub_questions.map(sq => ({
            ...sq.toJSON(),
            given_answer: null,
            given_answer_string: null
          }));
        }

        thematicAreasMap[taId].screening_questions.push(questionData);
      }
    }

    // Convert map to array and sort to ensure "Generali" (id=-1) appears first
    const thematicAreasList = Object.values(thematicAreasMap).sort((a, b) => {
      // "Generali" (id=-1) should always be first
      if (a.id === -1) return -1;
      if (b.id === -1) return 1;
      // Otherwise sort by id ascending
      return a.id - b.id;
    });

    // Load previous replies from TeamReply
    console.log('[QuestionnaireController] Loading previous replies for team:', userTeam.id);

    // Load ALL replies for this team from ALL non-archived screenings
    // Each question belongs to a specific thematic_area, so replies will be correctly associated
    const teamReplies = await TeamReply.findAll({
      where: {
        team_id: userTeam.id,
        deleted: false
      },
      include: [{
        model: Screening,
        as: 'screening',
        where: {
          deleted: false,
          archived: false
        },
        required: true
      }]
    });

    // Associate replies to questions and sub-questions
    console.log(`[QuestionnaireController] Loaded ${teamReplies.length} team replies`);

    for (const ta of thematicAreasList) {
      for (const question of ta.screening_questions) {
        // Main question reply - MUST match both question_id AND thematic_area_id
        // since the same question can appear in multiple thematic areas
        const reply = teamReplies.find(r =>
          r.question_id === question.id &&
          r.screening &&
          r.screening.thematic_area_id === ta.id
        );
        if (reply) {
          console.log(`[QuestionnaireController] Found reply for question ${question.id} in thematic_area ${ta.id}: reply=${reply.reply}, reply_string=${reply.reply_string}, screening_id=${reply.screening_id}`);
          question.given_answer = reply.reply;
          question.given_answer_string = reply.reply_string;
        }

        // Sub-questions replies
        if (question.sub_questions && question.sub_questions.length > 0) {
          for (const subQuestion of question.sub_questions) {
            const subReply = teamReplies.find(r =>
              r.question_id === subQuestion.id &&
              r.screening &&
              r.screening.thematic_area_id === ta.id
            );
            if (subReply) {
              console.log(`[QuestionnaireController] Found sub-reply for sub-question ${subQuestion.id} in thematic_area ${ta.id}: reply=${subReply.reply}, reply_string=${subReply.reply_string}, screening_id=${subReply.screening_id}`);
              subQuestion.given_answer = subReply.reply;
              subQuestion.given_answer_string = subReply.reply_string;
            }
          }
        }
      }
    }

    console.log(`[QuestionnaireController] Returning ${thematicAreasList.length} thematic areas`);

    res.json({
      thematicAreas: thematicAreasList,
      screeningType
    });
  } catch (error) {
    console.error('[QuestionnaireController] Error initializing screening:', error);
    res.status(500).json({
      error: 'Errore nell\'inizializzazione dello screening',
      details: error.message
    });
  }
};

/**
 * Elaborate screening for a single thematic area
 * REPLICA ESATTA del metodo elaborateScreening del legacy
 */
exports.elaborateScreening = async (req, res) => {
  try {
    console.log('[QuestionnaireController] elaborateScreening - Start');
    const { thematicAreaId, questions, screeningType } = req.body;

    const user = await User.findByPk(req.user.id);

    // Fetch teams using raw SQL (same reason as initializeScreening)
    const teamsQuery = `
      SELECT t.* FROM app_team t
      INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
      WHERE ut.app_user_id = :userId AND t.deleted = 'N'
      LIMIT 1
    `;

    const activeTeams = await sequelize.query(teamsQuery, {
      replacements: { userId: user.id },
      type: QueryTypes.SELECT
    });

    if (!activeTeams || activeTeams.length === 0) {
      return res.status(400).json({
        error: 'Utente non associato a nessun team'
      });
    }

    const userTeam = activeTeams[0];

    // Save or update screening - find the most recent non-archived screening
    let screening = await Screening.findOne({
      where: {
        team_id: userTeam.id,
        thematic_area_id: thematicAreaId,
        deleted: false,
        archived: false
      },
      order: [['id', 'DESC']]
    });

    if (!screening) {
      screening = await Screening.create({
        team_id: userTeam.id,
        thematic_area_id: thematicAreaId,
        insertion_username: user.username,
        last_modify_username: user.username
      });
      console.log('[QuestionnaireController] Created new screening:', screening.id);
    } else {
      console.log('[QuestionnaireController] Using existing screening:', screening.id);
      screening.last_modify_username = user.username;
      screening.last_modify_date = new Date();
      await screening.save();
    }

    // Save team replies
    console.log('[QuestionnaireController] Saving team replies for', questions.length, 'questions to screening', screening.id);
    console.log('[QuestionnaireController] Questions received:', JSON.stringify(questions, null, 2));

    for (const q of questions) {
      console.log(`[QuestionnaireController] Processing question ${q.id}: given_answer=${q.given_answer}, given_answer_string=${q.given_answer_string}`);

      // Skip questions with no answer (null or undefined)
      // But keep questions with answer 0 or -1 as they are valid answers
      if (q.given_answer === null && !q.given_answer_string) {
        console.log(`[QuestionnaireController] Skipping question ${q.id} - no answer provided`);
        continue;
      }

      // Check if reply already exists
      let teamReply = await TeamReply.findOne({
        where: {
          team_id: userTeam.id,
          question_id: q.id,
          screening_id: screening.id
        }
      });

      if (teamReply) {
        // Update existing reply - set fields and mark as changed for Sequelize
        console.log(`[QuestionnaireController] BEFORE UPDATE - reply id=${teamReply.id}, old answer=${teamReply.reply}, new answer=${q.given_answer}`);
        teamReply.reply = q.given_answer;
        teamReply.reply_string = q.given_answer_string;
        teamReply.last_modify_username = user.username;
        teamReply.last_modify_date = new Date();
        // Force Sequelize to detect changes on mapped fields
        teamReply.changed('reply', true);
        teamReply.changed('reply_string', true);
        const savedReply = await teamReply.save();
        console.log(`[QuestionnaireController] AFTER UPDATE - saved reply: id=${savedReply.id}, answer=${savedReply.reply}, dataValues:`, savedReply.dataValues);
      } else {
        // Create new reply
        await TeamReply.create({
          team_id: userTeam.id,
          question_id: q.id,
          screening_id: screening.id,
          reply: q.given_answer,
          reply_string: q.given_answer_string,
          insertion_username: user.username,
          last_modify_username: user.username
        });
      }

      // Save sub-question replies if any
      if (q.sub_questions && q.sub_questions.length > 0) {
        for (const sq of q.sub_questions) {
          console.log(`[QuestionnaireController] Processing sub-question ${sq.id}: given_answer=${sq.given_answer}, given_answer_string=${sq.given_answer_string}`);

          // Skip sub-questions with no answer
          if (sq.given_answer === null && !sq.given_answer_string) {
            console.log(`[QuestionnaireController] Skipping sub-question ${sq.id} - no answer provided`);
            continue;
          }

          let subReply = await TeamReply.findOne({
            where: {
              team_id: userTeam.id,
              question_id: sq.id,
              screening_id: screening.id
            }
          });

          if (subReply) {
            // Update existing sub-reply - set fields and mark as changed for Sequelize
            subReply.reply = sq.given_answer;
            subReply.reply_string = sq.given_answer_string;
            subReply.last_modify_username = user.username;
            subReply.last_modify_date = new Date();
            // Force Sequelize to detect changes on mapped fields
            subReply.changed('reply', true);
            subReply.changed('reply_string', true);
            await subReply.save();
          } else{
            await TeamReply.create({
              team_id: userTeam.id,
              question_id: sq.id,
              screening_id: screening.id,
              reply: sq.given_answer,
              reply_string: sq.given_answer_string,
              insertion_username: user.username,
              last_modify_username: user.username
            });
          }
        }
      }
    }

    // Elaborate screening results (find matching protocol rules)
    console.log('[QuestionnaireController] Elaborating screening results');

    const suggestedExaminations = [];

    for (const q of questions) {
      // Find protocol rules that match the answer
      const matchingRules = await ProtocolRule.findAll({
        where: {
          question_id: q.id,
          thematic_area_id: thematicAreaId,
          answer: q.given_answer,
          deleted: false
        },
        include: [{
          model: ExaminationPathology,
          as: 'examination',
          where: { deleted: false },
          required: true
        }]
      });

      for (const rule of matchingRules) {
        if (rule.examination) {
          suggestedExaminations.push({
            examination: rule.examination,
            rule: rule,
            question: q
          });
        }
      }

      // Check sub-questions
      if (q.sub_questions && q.sub_questions.length > 0) {
        for (const sq of q.sub_questions) {
          const subMatchingRules = await ProtocolRule.findAll({
            where: {
              question_id: sq.id,
              thematic_area_id: thematicAreaId,
              deleted: false
            },
            include: [{
              model: ExaminationPathology,
              as: 'examination',
              where: { deleted: false },
              required: true
            }]
          });

          for (const rule of subMatchingRules) {
            // Check if answer matches or if it's a select type question
            if (rule.answer === sq.given_answer || (sq.type_question === 'select' && sq.given_answer_string)) {
              if (rule.examination) {
                suggestedExaminations.push({
                  examination: rule.examination,
                  rule: rule,
                  question: sq
                });
              }
            }
          }
        }
      }
    }

    console.log(`[QuestionnaireController] Found ${suggestedExaminations.length} suggested examinations`);

    res.json({
      success: true,
      screening: screening,
      suggestedExaminations: suggestedExaminations,
      nothingSuggested: suggestedExaminations.length === 0 ? 1 : -1
    });
  } catch (error) {
    console.error('[QuestionnaireController] Error elaborating screening:', error);
    res.status(500).json({
      error: 'Errore nell\'elaborazione dello screening',
      details: error.message
    });
  }
};

/**
 * Elaborate all screening thematic areas
 * REPLICA ESATTA del metodo elaborateAllScreening del legacy
 */
exports.elaborateAllScreening = async (req, res) => {
  try {
    console.log('[QuestionnaireController] elaborateAllScreening - Start');
    const { thematicAreas } = req.body;

    let allSuggestedExaminations = [];
    let nothingSuggested = 1;

    for (const ta of thematicAreas) {
      const result = await elaborateSingleThematicArea(req, ta);

      if (result.suggestedExaminations.length > 0) {
        allSuggestedExaminations = [...allSuggestedExaminations, ...result.suggestedExaminations];
        nothingSuggested = -1;
      }
    }

    console.log(`[QuestionnaireController] Total suggested examinations: ${allSuggestedExaminations.length}`);

    res.json({
      success: true,
      suggestedExaminations: allSuggestedExaminations,
      nothingSuggested: nothingSuggested
    });
  } catch (error) {
    console.error('[QuestionnaireController] Error elaborating all screening:', error);
    res.status(500).json({
      error: 'Errore nell\'elaborazione completa dello screening',
      details: error.message
    });
  }
};

/**
 * Helper function to elaborate a single thematic area
 */
async function elaborateSingleThematicArea(req, thematicArea) {
  const { screening_questions, id: thematicAreaId } = thematicArea;

  const user = await User.findByPk(req.user.id);

  // Fetch teams using raw SQL (same reason as initializeScreening)
  const teamsQuery = `
    SELECT t.* FROM app_team t
    INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
    WHERE ut.app_user_id = :userId AND t.deleted = 'N'
    LIMIT 1
  `;

  const activeTeams = await sequelize.query(teamsQuery, {
    replacements: { userId: user.id },
    type: QueryTypes.SELECT
  });

  const userTeam = activeTeams[0];

  // Save or update screening
  let screening = await Screening.findOne({
    where: {
      team_id: userTeam.id,
      thematic_area_id: thematicAreaId,
      deleted: false
    }
  });

  if (!screening) {
    screening = await Screening.create({
      team_id: userTeam.id,
      thematic_area_id: thematicAreaId,
      insertion_username: user.username,
      last_modify_username: user.username
    });
  } else {
    screening.last_modify_username = user.username;
    screening.last_modify_date = new Date();
    await screening.save();
  }

  // Save team replies
  for (const q of screening_questions) {
    console.log(`[QuestionnaireController] Processing question ${q.id}: given_answer=${q.given_answer}, given_answer_string=${q.given_answer_string}`);

    let teamReply = await TeamReply.findOne({
      where: {
        team_id: userTeam.id,
        question_id: q.id,
        screening_id: screening.id
      }
    });

    if (teamReply) {
      teamReply.reply = q.given_answer;
      teamReply.reply_string = q.given_answer_string;
      teamReply.last_modify_username = user.username;
      teamReply.last_modify_date = new Date();
      // Force Sequelize to detect changes on mapped fields
      teamReply.changed('reply', true);
      teamReply.changed('reply_string', true);
      await teamReply.save();
    } else {
      await TeamReply.create({
        team_id: userTeam.id,
        question_id: q.id,
        screening_id: screening.id,
        reply: q.given_answer,
        reply_string: q.given_answer_string,
        insertion_username: user.username,
        last_modify_username: user.username
      });
    }

    // Save sub-question replies if any
    if (q.sub_questions && q.sub_questions.length > 0) {
      for (const sq of q.sub_questions) {
        console.log(`[QuestionnaireController] Processing sub-question ${sq.id}: given_answer=${sq.given_answer}, given_answer_string=${sq.given_answer_string}`);

        // Skip sub-questions with no answer
        if (sq.given_answer === null && !sq.given_answer_string) {
          console.log(`[QuestionnaireController] Skipping sub-question ${sq.id} - no answer provided`);
          continue;
        }

        let subReply = await TeamReply.findOne({
          where: {
            team_id: userTeam.id,
            question_id: sq.id,
            screening_id: screening.id
          }
        });

        if (subReply) {
          // Update existing sub-reply - set fields and mark as changed for Sequelize
          subReply.reply = sq.given_answer;
          subReply.reply_string = sq.given_answer_string;
          subReply.last_modify_username = user.username;
          subReply.last_modify_date = new Date();
          // Force Sequelize to detect changes on mapped fields
          subReply.changed('reply', true);
          subReply.changed('reply_string', true);
          await subReply.save();
        } else {
          await TeamReply.create({
            team_id: userTeam.id,
            question_id: sq.id,
            screening_id: screening.id,
            reply: sq.given_answer,
            reply_string: sq.given_answer_string,
            insertion_username: user.username,
            last_modify_username: user.username
          });
        }
      }
    }
  }

  // Elaborate screening results
  const suggestedExaminations = [];

  for (const q of screening_questions) {
    const matchingRules = await ProtocolRule.findAll({
      where: {
        question_id: q.id,
        thematic_area_id: thematicAreaId,
        answer: q.given_answer,
        deleted: false
      },
      include: [{
        model: ExaminationPathology,
        as: 'examination',
        where: { deleted: false },
        required: true
      }]
    });

    for (const rule of matchingRules) {
      if (rule.examination) {
        suggestedExaminations.push({
          examination: rule.examination,
          rule: rule,
          question: q
        });
      }
    }
  }

  return {
    screening,
    suggestedExaminations
  };
}

/**
 * Get user's previous screenings
 */
exports.getScreenings = async (req, res) => {
  try {
    console.log('[QuestionnaireController] getScreenings - Start');

    const user = await User.findByPk(req.user.id);

    // Fetch teams using raw SQL (same reason as initializeScreening)
    const teamsQuery = `
      SELECT t.* FROM app_team t
      INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
      WHERE ut.app_user_id = :userId AND t.deleted = 'N'
      LIMIT 1
    `;

    const activeTeams = await sequelize.query(teamsQuery, {
      replacements: { userId: user.id },
      type: QueryTypes.SELECT
    });

    if (!activeTeams || activeTeams.length === 0) {
      return res.status(400).json({
        error: 'Utente non associato a nessun team'
      });
    }

    const userTeam = activeTeams[0];

    const screenings = await Screening.findAll({
      where: {
        team_id: userTeam.id,
        deleted: false
      },
      include: [
        {
          model: ThematicArea,
          as: 'thematic_area'
        },
        {
          model: ScreeningResult,
          as: 'results',
          where: { deleted: false },
          required: false
        }
      ],
      order: [['last_modify_date', 'DESC']]
    });

    console.log(`[QuestionnaireController] Found ${screenings.length} screenings`);

    res.json(screenings);
  } catch (error) {
    console.error('[QuestionnaireController] Error getting screenings:', error);
    res.status(500).json({
      error: 'Errore nel caricamento degli screening',
      details: error.message
    });
  }
};
