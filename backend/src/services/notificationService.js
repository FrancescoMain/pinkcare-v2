const { Op } = require('sequelize');
const { Notification, Typology, User, Team, Role } = require('../models');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Notification Service
 * Replicates legacy DataServiceImpl notification methods
 */
class NotificationService {

  /**
   * Get unread notifications for a user (for header bell icon)
   * Replicates legacy getNotifications(User user)['generic']
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async getUnreadNotifications(userId) {
    const notifications = await Notification.findAll({
      where: {
        userId,
        active: true
      },
      include: [
        {
          model: Typology,
          as: 'typology',
          attributes: ['id', 'label']
        }
      ],
      order: [['insertionDate', 'DESC']]
    });

    return notifications.map(n => this._transform(n));
  }

  /**
   * Get all notifications for a user (paginated, for profile tab=2)
   * Replicates legacy dataService.find(notification, joinString, page, offset)
   * @param {number} userId
   * @param {number} page - 0-based page number
   * @param {number} limit - items per page
   * @returns {Promise<{notifications: Array, total: number, page: number, totalPages: number}>}
   */
  async getAllNotifications(userId, page = 0, limit = 15) {
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Typology,
          as: 'typology',
          attributes: ['id', 'label']
        },
        {
          model: User,
          as: 'notifyBy',
          attributes: ['id', 'name', 'surname', 'email']
        }
      ],
      order: [['insertionDate', 'DESC']],
      limit,
      offset: page * limit
    });

    return {
      notifications: rows.map(n => this._transform(n)),
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Mark a single notification as read
   * Replicates legacy markNotificationAsRead(Notification n)
   * @param {number} notificationId
   * @param {number} userId - for ownership check
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notifica non trovata');
    }

    await notification.update({
      active: false,
      lastModifyDate: new Date()
    });

    return { id: notification.id, active: false };
  }

  /**
   * Mark all notifications as read for a user
   * Replicates legacy markAllNotificationsAsRead(List<Notification>)
   * @param {number} userId
   * @returns {Promise<number>} count of updated notifications
   */
  async markAllAsRead(userId) {
    const [count] = await Notification.update(
      {
        active: false,
        lastModifyDate: new Date()
      },
      {
        where: {
          userId,
          active: true
        }
      }
    );

    return count;
  }

  /**
   * Soft-delete a notification
   * Replicates legacy delete_notification transition
   * @param {number} notificationId
   * @param {number} userId - for ownership check
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notifica non trovata');
    }

    await notification.update({
      deleted: true,
      lastModifyDate: new Date()
    });
  }

  /**
   * Get navigation link for a notification based on its typology
   * Replicates legacy Notification.getLink()
   * @param {number} notificationId
   * @param {number} userId
   * @returns {Promise<string>} navigation link
   */
  async getNotificationLink(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
      include: [
        {
          model: Typology,
          as: 'typology',
          attributes: ['id']
        },
        {
          model: User,
          as: 'notifyBy',
          attributes: ['id'],
          include: [{
            model: Team,
            as: 'teams',
            attributes: ['id'],
            through: { attributes: [] }
          }]
        }
      ]
    });

    if (!notification) {
      throw new Error('Notifica non trovata');
    }

    // Mark as read
    await notification.update({ active: false, lastModifyDate: new Date() });

    // Calculate link based on typology (same as legacy Notification.getLink())
    const typologyId = notification.typology?.id;
    if (typologyId == Notification.TYPOLOGY.CHANGE_PASSWORD) {
      return '/profile?tab=0';
    } else if (typologyId == Notification.TYPOLOGY.BUSINESS_CHANGES) {
      const teamId = notification.notifyBy?.teams?.[0]?.id;
      return `/business?business_id=${teamId || ''}`;
    } else if (typologyId == Notification.TYPOLOGY.EXAMINATION_CONTROL) {
      return '/consumer?tab=2';
    }
    return '/profile?tab=2';
  }

  /**
   * Send BUSINESS_CHANGES notification to all admin users
   * Replicates legacy DataServiceImpl.sendBusinessChangesNotification()
   * @param {number} businessUserId - The business user who made changes
   * @param {number} teamId - The team being modified
   * @param {string} requestedChanges - Description of requested changes
   * @param {string} approvedChanges - Description of approved changes (for feedback to business)
   * @param {string} deniedChanges - Description of denied changes (for feedback to business)
   */
  async sendBusinessChangesNotification(businessUserId, teamId, requestedChanges, approvedChanges, deniedChanges) {
    // Find all admin users (ROLE_PINKCARE or ROLE_ADMINISTRATION_SECTION)
    const adminUsers = await sequelize.query(`
      SELECT DISTINCT u.id FROM app_user u
      INNER JOIN app_user_app_role ur ON u.id = ur.user_id
      INNER JOIN app_role r ON ur.role_id = r.id
      WHERE r.name IN ('ROLE_PINKCARE', 'ROLE_ADMINISTRATION_SECTION', 'ROLE_BUSINESS_CHANGE_NOTIFICATION')
    `, { type: QueryTypes.SELECT });

    const businessUser = await User.findByPk(businessUserId);
    const businessName = businessUser ? `${businessUser.name || ''} ${businessUser.surname || ''}`.trim() : '';

    if (requestedChanges) {
      // Notify admins about requested changes
      const message = `Modifiche richieste da ${businessName}:\n${requestedChanges}`;
      for (const admin of adminUsers) {
        if (admin.id === businessUserId) continue;
        await Notification.create({
          message,
          title: 'Modifiche profilo business',
          active: true,
          deleted: false,
          typologyId: Notification.TYPOLOGY.BUSINESS_CHANGES,
          userId: admin.id,
          notifyById: businessUserId,
          teamId,
          insertionDate: new Date()
        });
      }
    }

    if (approvedChanges || deniedChanges) {
      // Notify business user about approval/rejection
      let message = '';
      if (approvedChanges) message += `Modifiche approvate:\n${approvedChanges}\n`;
      if (deniedChanges) message += `Modifiche rifiutate:\n${deniedChanges}`;
      await Notification.create({
        message: message.trim(),
        title: 'Esito modifiche profilo',
        active: true,
        deleted: false,
        typologyId: Notification.TYPOLOGY.BUSINESS_CHANGES,
        userId: businessUserId,
        teamId,
        insertionDate: new Date()
      });
    }
  }

  /**
   * Transform Notification model to API response
   * @private
   */
  _transform(n) {
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      insertionDate: n.insertionDate,
      active: n.active,
      typology: n.typology ? {
        id: n.typology.id,
        label: n.typology.label
      } : null,
      notifyBy: n.notifyBy ? {
        id: n.notifyBy.id,
        name: n.notifyBy.name,
        surname: n.notifyBy.surname
      } : null
    };
  }
}

module.exports = new NotificationService();
