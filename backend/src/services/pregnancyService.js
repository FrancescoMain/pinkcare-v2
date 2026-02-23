const { Op } = require('sequelize');
const { User, CalendarEvent, Team, sequelize } = require('../models');
const calendarService = require('./calendarService');

class PregnancyService {

  /**
   * Get current pregnancy status for a user
   * @param {number} userId - User ID
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} Pregnancy status
   */
  async getPregnancyStatus(userId, teamId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Utente non trovato');
    }

    const hasActivePregnancy = !!(user.childbirthdate && user.ovulationDate);

    // Always fetch last menses date (needed for "Il sistema ha calcolato" section)
    const lastMensesDate = await calendarService.getLastMensesDate(teamId);

    if (!hasActivePregnancy) {
      return {
        active: false,
        childbirthdate: null,
        ovulationDate: null,
        weekNumber: null,
        durationPeriod: user.durationPeriod || null,
        lastMensesDate
      };
    }

    // Calculate gestational week: weeks between ovulation and now + 1
    const ovulationDate = new Date(user.ovulationDate);
    const now = new Date();
    const diffMs = now.getTime() - ovulationDate.getTime();
    const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

    return {
      active: true,
      childbirthdate: user.childbirthdate,
      ovulationDate: user.ovulationDate,
      weekNumber,
      durationPeriod: user.durationPeriod || null,
      lastMensesDate
    };
  }

  /**
   * Calculate due date from last menses date and cycle duration
   * Replicates legacy CalendarEventServiceImpl.calculateOvulationDate + parent-flow.xml
   * @param {string} lastMensesDate - Date of last menstruation (ISO string)
   * @param {number} durationPeriod - Cycle length in days
   * @param {number} teamId - Team ID for overlap check
   * @returns {Object} Calculation result
   */
  async calculateDueDate(lastMensesDate, durationPeriod, teamId) {
    const lmp = new Date(lastMensesDate);

    // Legacy algorithm: ovulation = LMP + (durationPeriod / 2)
    const ovulationDays = Math.floor(durationPeriod / 2);
    const ovulationDate = new Date(lmp);
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDays);

    // Legacy algorithm: childbirthdate = ovulationDate + 265 days
    const childbirthdate = new Date(ovulationDate);
    childbirthdate.setDate(childbirthdate.getDate() + 265);

    // Calculate current gestational week
    const now = new Date();
    const diffMs = now.getTime() - ovulationDate.getTime();
    const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

    // Check for overlapping pregnancies
    const overlap = await this.checkOverlappingPregnancies(teamId, ovulationDate, childbirthdate);

    return {
      ovulationDate,
      childbirthdate,
      weekNumber,
      hasOverlap: overlap
    };
  }

  /**
   * Check for overlapping pregnancies in the given date range
   * Replicates legacy 3-part overlap check from parent-flow.xml
   * @param {number} teamId - Team ID
   * @param {Date} ovulationDate - Start of pregnancy period
   * @param {Date} childbirthdate - End of pregnancy period
   * @returns {Promise<boolean>} True if overlap found
   */
  async checkOverlappingPregnancies(teamId, ovulationDate, childbirthdate) {
    // Check 1: existing pregnancy ends after ovulation starts
    const check1 = await CalendarEvent.count({
      where: {
        teamId,
        typeId: calendarService.constructor.EVENT_TYPES.PREGNANCY,
        deleted: false,
        ending: { [Op.gte]: ovulationDate }
      }
    });
    if (check1 > 0) return true;

    // Check 2: existing pregnancy begins before childbirth ends
    const check2 = await CalendarEvent.count({
      where: {
        teamId,
        typeId: calendarService.constructor.EVENT_TYPES.PREGNANCY,
        deleted: false,
        beginning: { [Op.lte]: childbirthdate }
      }
    });
    if (check2 > 0) return true;

    return false;
  }

  /**
   * Save pregnancy: update user fields + create/update CalendarEvent PREGNANCY
   * Replicates legacy save_childbirthdate transition from parent-flow.xml
   * @param {number} userId - User ID
   * @param {number} teamId - Team ID
   * @param {Date} childbirthdate - Calculated due date
   * @param {Date} ovulationDate - Calculated ovulation date
   * @returns {Promise<Object>} Updated user data
   */
  async savePregnancy(userId, teamId, childbirthdate, ovulationDate) {
    const transaction = await sequelize.transaction();

    try {
      // Update user fields
      await User.update({
        childbirthdate: new Date(childbirthdate),
        ovulationDate: new Date(ovulationDate),
        lastModifyDate: new Date()
      }, {
        where: { id: userId },
        transaction
      });

      // Check for existing active pregnancy event
      const existingPregnancy = await CalendarEvent.findOne({
        where: {
          teamId,
          typeId: calendarService.constructor.EVENT_TYPES.PREGNANCY,
          deleted: false
        },
        transaction
      });

      if (existingPregnancy) {
        // Update existing
        await existingPregnancy.update({
          beginning: new Date(ovulationDate),
          ending: new Date(childbirthdate),
          lastModifyDate: new Date()
        }, { transaction });
      } else {
        // Create new pregnancy event
        await CalendarEvent.create({
          beginning: new Date(ovulationDate),
          ending: new Date(childbirthdate),
          typeId: calendarService.constructor.EVENT_TYPES.PREGNANCY,
          teamId,
          deleted: false,
          insertionDate: new Date(),
          lastModifyDate: new Date()
        }, { transaction });
      }

      await transaction.commit();

      // Recalculate week number for response
      const now = new Date();
      const ov = new Date(ovulationDate);
      const diffMs = now.getTime() - ov.getTime();
      const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

      return {
        childbirthdate: new Date(childbirthdate),
        ovulationDate: new Date(ovulationDate),
        weekNumber
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Terminate pregnancy: mark event as deleted, clear user fields
   * Replicates legacy terminate_pregnancy transition from parent-flow.xml
   * @param {number} userId - User ID
   * @param {number} teamId - Team ID
   * @param {string} pregnancyEndedDate - Date pregnancy ended
   * @returns {Promise<boolean>}
   */
  async terminatePregnancy(userId, teamId, pregnancyEndedDate) {
    const transaction = await sequelize.transaction();

    try {
      const endDate = pregnancyEndedDate ? new Date(pregnancyEndedDate) : new Date();

      // Mark pregnancy event as deleted and set ending date
      const pregnancyEvent = await CalendarEvent.findOne({
        where: {
          teamId,
          typeId: calendarService.constructor.EVENT_TYPES.PREGNANCY,
          deleted: false
        },
        transaction
      });

      if (pregnancyEvent) {
        await pregnancyEvent.update({
          ending: endDate,
          deleted: true,
          lastModifyDate: new Date()
        }, { transaction });
      }

      // Clear user pregnancy fields
      await User.update({
        childbirthdate: null,
        ovulationDate: null,
        lastModifyDate: new Date()
      }, {
        where: { id: userId },
        transaction
      });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new PregnancyService();
