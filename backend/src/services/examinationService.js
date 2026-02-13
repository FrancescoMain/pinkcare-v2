const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const {
  RecommendedExamination,
  ExaminationPathology,
  Protocol,
  ProtocolRule,
  Screening,
  ScreeningResult,
  ThematicArea,
  AttachedFile
} = require('../models');

/**
 * Examination Service
 * Handles recommended examination business logic
 * Replicates legacy RecommendedExaminationServiceImpl
 */
class ExaminationService {

  /**
   * Get age-based recommended examinations
   * Replicates legacy getAgeExaminations()
   * @param {number} teamId - Team ID
   * @param {Date} birthday - User's birthday
   * @returns {Promise<Array>} Array of examination objects
   */
  async getAgeExaminations(teamId, birthday) {
    if (!birthday) {
      return [];
    }

    // Calculate age
    const now = new Date();
    const birth = new Date(birthday);
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    // Find matching protocol by age range
    const protocol = await Protocol.findOne({
      where: {
        inferior_limit: { [Op.lte]: age },
        superior_limit: { [Op.gte]: age }
      }
    });

    if (!protocol) {
      return [];
    }

    // Get protocol rules where question_id IS NULL (age-based, not screening-based)
    // Include only examination pathologies where examination = true
    const protocolRules = await ProtocolRule.findAll({
      where: {
        protocol_id: protocol.id,
        question_id: null,
        deleted: false
      },
      include: [
        {
          model: ExaminationPathology,
          as: 'examination',
          where: { examination: true },
          required: true
        }
      ]
    });

    if (protocolRules.length === 0) {
      return [];
    }

    // Fetch all unconfirmed recommended examinations for this team
    const existingExams = await RecommendedExamination.findAll({
      where: {
        teamId,
        confirmed: false
      },
      include: [
        {
          model: ExaminationPathology,
          as: 'examination',
          attributes: ['id', 'label', 'periodicalControlDays']
        }
      ]
    });

    // Build result: for each protocol rule, find matching exam or create virtual one
    const results = [];
    for (const rule of protocolRules) {
      const examinationId = rule.examination.id;

      // Find existing unconfirmed exam matching this examination type and protocol rule
      const existing = existingExams.find(
        e => e.examinationId === examinationId && e.protocolRuleId === rule.id
      );

      if (existing) {
        results.push(this._transformExam(existing));
      } else {
        // Virtual object - no DB record yet
        results.push({
          id: null,
          examinationId: examinationId,
          protocolRuleId: rule.id,
          label: rule.examination.label,
          controlDate: null,
          nextControlDate: null,
          calculatedDate: null,
          periodicalControl: false,
          confirmed: false,
          note: null,
          periodicalControlDays: rule.examination.periodicalControlDays
        });
      }
    }

    // Sort by controlDate ASC, nulls last
    results.sort((a, b) => {
      if (!a.controlDate && !b.controlDate) return 0;
      if (!a.controlDate) return 1;
      if (!b.controlDate) return -1;
      return new Date(a.controlDate) - new Date(b.controlDate);
    });

    return results;
  }

  /**
   * Get routine (periodical) recommended examinations
   * Replicates legacy getRoutineExaminations()
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} Array of routine examination objects
   */
  async getRoutineExaminations(teamId) {
    const exams = await RecommendedExamination.findAll({
      where: {
        teamId,
        periodicalControl: true,
        confirmed: false
      },
      include: [
        {
          model: ExaminationPathology,
          as: 'examination',
          attributes: ['id', 'label', 'periodicalControlDays']
        }
      ],
      order: [[sequelize.literal('control_date ASC NULLS LAST')]]
    });

    return exams.map(e => this._transformExam(e));
  }

  /**
   * Get screening-based recommended examinations
   * Replicates legacy findForSuggestedExamination()
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} Array of screening groups with examinations
   */
  async getScreeningExaminations(teamId) {
    const screenings = await Screening.findAll({
      where: {
        team_id: teamId,
        deleted: false
      },
      include: [
        {
          model: ThematicArea,
          as: 'thematic_area',
          attributes: ['id', 'label']
        },
        {
          model: ScreeningResult,
          as: 'results',
          where: { deleted: false },
          required: false,
          include: [
            {
              model: RecommendedExamination,
              as: 'result',
              required: false,
              include: [
                {
                  model: ExaminationPathology,
                  as: 'examination',
                  attributes: ['id', 'label', 'periodicalControlDays']
                }
              ]
            }
          ]
        }
      ],
      order: [
        ['archived', 'ASC'],
        ['insertion_date', 'DESC']
      ]
    });

    // Filter to only screenings that have unconfirmed exams
    const result = [];
    for (const screening of screenings) {
      const exams = [];
      for (const sr of (screening.results || [])) {
        if (sr.result && !sr.result.confirmed && !sr.result.deleted) {
          exams.push(this._transformExam(sr.result));
        }
      }

      if (exams.length > 0) {
        // Sort exams by controlDate ASC, nulls last
        exams.sort((a, b) => {
          if (!a.controlDate && !b.controlDate) return 0;
          if (!a.controlDate) return 1;
          if (!b.controlDate) return -1;
          return new Date(a.controlDate) - new Date(b.controlDate);
        });

        result.push({
          screeningId: screening.id,
          thematicArea: screening.thematic_area?.label || '',
          insertionDate: screening.insertion_date,
          archived: screening.archived,
          examinations: exams
        });
      }
    }

    return result;
  }

  /**
   * Mark/update exam date
   * @param {number|string} examId - Exam ID (null or 'new' for new record)
   * @param {Date} controlDate - Control date
   * @param {number} teamId - Team ID
   * @param {number} examinationId - ExaminationPathology ID
   * @param {number|null} protocolRuleId - Protocol rule ID (optional)
   * @param {string} username - Current username
   * @returns {Promise<Object>} Updated/created exam
   */
  async markExamDate(examId, controlDate, teamId, examinationId, protocolRuleId, username) {
    const now = new Date();

    if (!examId || examId === 'new') {
      // INSERT new recommended examination
      const [result] = await sequelize.query(`
        INSERT INTO app_recommended_examination (
          id, team_id, examination_id, protocol_rule_id,
          control_date, periodical_control, confirmed, deleted,
          insertion_date, insertion_username, last_modify_date, last_modify_username
        ) VALUES (
          nextval('app_recommended_examination_id_seq'),
          :teamId, :examinationId, :protocolRuleId,
          :controlDate, false, false, false,
          :now, :username, :now, :username
        ) RETURNING *
      `, {
        replacements: {
          teamId,
          examinationId,
          protocolRuleId: protocolRuleId || null,
          controlDate,
          now,
          username
        },
        type: sequelize.QueryTypes.INSERT
      });

      return { id: result[0].id, controlDate };
    }

    // UPDATE existing exam
    const exam = await RecommendedExamination.findByPk(examId);
    if (!exam) {
      throw new Error('Esame non trovato');
    }

    await exam.update({
      controlDate,
      lastModifyDate: now,
      lastModifyUsername: username
    });

    return this._transformExam(exam);
  }

  /**
   * Confirm an examination as completed
   * @param {number} examId - Exam ID
   * @param {string|null} note - Optional note
   * @param {string} username - Current username
   * @returns {Promise<Object>} Confirmed exam
   */
  async confirmExamination(examId, note, username) {
    const now = new Date();

    const exam = await RecommendedExamination.findByPk(examId, {
      include: [
        {
          model: ExaminationPathology,
          as: 'examination',
          attributes: ['id', 'label', 'periodicalControlDays']
        }
      ]
    });

    if (!exam) {
      throw new Error('Esame non trovato');
    }

    await exam.update({
      confirmed: true,
      note: note || exam.note,
      lastModifyDate: now,
      lastModifyUsername: username
    });

    // If periodicalControlDays > 0, create next periodic exam
    const periodicalDays = exam.examination?.periodicalControlDays;
    if (periodicalDays && periodicalDays > 0) {
      const baseDate = exam.controlDate || now;
      const nextControlDate = new Date(baseDate);
      nextControlDate.setDate(nextControlDate.getDate() + periodicalDays);

      const calculatedDate = new Date(nextControlDate);

      await sequelize.query(`
        INSERT INTO app_recommended_examination (
          id, team_id, examination_id, protocol_rule_id, screening_id,
          control_date, next_control_date, calculated_date,
          periodical_control, confirmed, deleted,
          insertion_date, insertion_username, last_modify_date, last_modify_username
        ) VALUES (
          nextval('app_recommended_examination_id_seq'),
          :teamId, :examinationId, :protocolRuleId, :screeningId,
          :controlDate, :nextControlDate, :calculatedDate,
          true, false, false,
          :now, :username, :now, :username
        )
      `, {
        replacements: {
          teamId: exam.teamId,
          examinationId: exam.examinationId,
          protocolRuleId: exam.protocolRuleId || null,
          screeningId: exam.screeningId || null,
          controlDate: nextControlDate,
          nextControlDate: null,
          calculatedDate,
          now,
          username
        },
        type: sequelize.QueryTypes.INSERT
      });
    }

    return this._transformExam(exam);
  }

  /**
   * Remove date from an examination
   * @param {number} examId - Exam ID
   * @param {string} username - Current username
   * @returns {Promise<Object>} Updated exam
   */
  async removeDate(examId, username) {
    const exam = await RecommendedExamination.findByPk(examId);
    if (!exam) {
      throw new Error('Esame non trovato');
    }

    await exam.update({
      controlDate: null,
      nextControlDate: null,
      calculatedDate: null,
      lastModifyDate: new Date(),
      lastModifyUsername: username
    });

    return this._transformExam(exam);
  }

  /**
   * Toggle archive status of a screening
   * @param {number} screeningId - Screening ID
   * @param {number} teamId - Team ID (for ownership verification)
   * @returns {Promise<boolean>} New archived state
   */
  async toggleArchiveScreening(screeningId, teamId) {
    const screening = await Screening.findOne({
      where: {
        id: screeningId,
        team_id: teamId,
        deleted: false
      }
    });

    if (!screening) {
      throw new Error('Screening non trovato');
    }

    const newArchived = !screening.archived;
    await screening.update({
      archived: newArchived,
      last_modify_date: new Date()
    });

    return newArchived;
  }

  /**
   * Get all unconfirmed examinations for the "Suggested Examinations" table
   * Replicates flowScope.examinations in examinations_history.xhtml
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} Array of unconfirmed examinations
   */
  async getSuggestedExaminations(teamId) {
    const exams = await RecommendedExamination.findAll({
      where: {
        teamId,
        confirmed: false
      },
      include: [
        {
          model: ExaminationPathology,
          as: 'examination',
          attributes: ['id', 'label', 'periodicalControlDays']
        }
      ],
      order: [[sequelize.literal('control_date ASC NULLS LAST')]]
    });

    return exams.map(e => this._transformExam(e));
  }

  /**
   * Get examination history (confirmed exams)
   * Replicates flowScope.examinationHistory in examinations_history.xhtml
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} Array of confirmed examinations
   */
  async getExaminationHistory(teamId) {
    const exams = await RecommendedExamination.findAll({
      where: {
        teamId,
        confirmed: true
      },
      include: [
        {
          model: ExaminationPathology,
          as: 'examination',
          attributes: ['id', 'label', 'periodicalControlDays']
        }
      ],
      order: [['controlDate', 'DESC']]
    });

    return exams.map(e => this._transformExam(e));
  }

  /**
   * Get attachments for an examination
   * @param {number} examId - RecommendedExamination ID
   * @returns {Promise<Array>} Array of attached files
   */
  async getAttachments(examId) {
    const files = await AttachedFile.findAll({
      where: {
        resultId: examId
      },
      order: [['insertionDate', 'DESC']]
    });

    return files.map(f => ({
      id: f.id,
      publicName: f.publicName,
      filename: f.filename,
      pathFile: f.pathFile,
      weight: f.weight,
      insertionDate: f.insertionDate
    }));
  }

  /**
   * Upload an attachment for an examination
   * @param {number} examId - RecommendedExamination ID
   * @param {Object} file - Multer file object
   * @param {string} username - Current username
   * @returns {Promise<Object>} Created attachment
   */
  async uploadAttachment(examId, file, username) {
    const now = new Date();
    // Use multer's actual filename on disk (not a new one)
    const filename = file.filename;
    const weightMB = (file.size / (1024 * 1024)).toFixed(2);

    const [result] = await sequelize.query(`
      INSERT INTO app_attached_file (
        id, result_id, filename, public_name, path_file, public_path,
        weight, deleted, invia_notifica,
        insertion_date, insertion_username, last_modify_date, last_modify_username
      ) VALUES (
        nextval('app_attached_file_id_seq'),
        :resultId, :filename, :publicName, :pathFile, :publicPath,
        :weight, false, 'Y',
        :now, :username, :now, :username
      ) RETURNING *
    `, {
      replacements: {
        resultId: examId,
        filename,
        publicName: file.originalname,
        pathFile: file.destination + '/',
        publicPath: '/uploads/examinations/',
        weight: weightMB,
        now,
        username
      },
      type: sequelize.QueryTypes.INSERT
    });

    return {
      id: result[0].id,
      publicName: file.originalname,
      filename,
      weight: weightMB,
      insertionDate: now
    };
  }

  /**
   * Get attachment file info for download
   * @param {number} attachmentId - AttachedFile ID
   * @param {number} teamId - Team ID for ownership verification
   * @returns {Promise<Object>} Attachment with file path info
   */
  async getAttachmentFile(attachmentId, teamId) {
    const attachment = await AttachedFile.findByPk(attachmentId, {
      include: [{
        model: RecommendedExamination,
        as: 'result',
        attributes: ['teamId']
      }]
    });

    if (!attachment) {
      throw new Error('Allegato non trovato');
    }

    if (attachment.result && attachment.result.teamId !== teamId) {
      throw new Error('Non autorizzato');
    }

    return {
      filename: attachment.filename,
      publicName: attachment.publicName,
      pathFile: attachment.pathFile
    };
  }

  /**
   * Delete an attachment
   * @param {number} attachmentId - AttachedFile ID
   * @param {number} teamId - Team ID for ownership verification
   * @returns {Promise<void>}
   */
  async deleteAttachment(attachmentId, teamId) {
    const attachment = await AttachedFile.findByPk(attachmentId, {
      include: [{
        model: RecommendedExamination,
        as: 'result',
        attributes: ['teamId']
      }]
    });

    if (!attachment) {
      throw new Error('Allegato non trovato');
    }

    if (attachment.result && attachment.result.teamId !== teamId) {
      throw new Error('Non autorizzato');
    }

    await attachment.update({ deleted: true });
  }

  /**
   * Transform RecommendedExamination model to API response
   * @private
   */
  _transformExam(exam) {
    return {
      id: exam.id,
      examinationId: exam.examinationId,
      protocolRuleId: exam.protocolRuleId,
      screeningId: exam.screeningId,
      label: exam.examination?.label || '',
      controlDate: exam.controlDate,
      nextControlDate: exam.nextControlDate,
      calculatedDate: exam.calculatedDate,
      periodicalControl: exam.periodicalControl,
      confirmed: exam.confirmed,
      note: exam.note,
      periodicalControlDays: exam.examination?.periodicalControlDays || null
    };
  }
}

module.exports = new ExaminationService();
