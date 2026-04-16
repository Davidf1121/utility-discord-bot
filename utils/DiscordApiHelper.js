import { createLogger } from './Logger.js';

const logger = createLogger('DiscordApiHelper');
const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Helper class for interacting with Discord's REST API directly.
 * Useful for features not yet fully supported by discord.js, like Components v2.
 */
export class DiscordApiHelper {
  /**
   * Send a raw request to the Discord API.
   * @param {string} endpoint - The API endpoint (e.g., '/channels/123/messages')
   * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
   * @param {Object} body - Request body
   * @returns {Promise<Object>} - The API response
   */
  static async sendRequest(endpoint, method = 'GET', body = null) {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN not found in environment variables');
    }

    const url = `${DISCORD_API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        logger.error(`API Request failed: ${response.status} ${response.statusText}`, data);
        const error = new Error(`Discord API error: ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status) {
        // Already logged above
        throw error;
      }
      logger.error('Error sending request to Discord API:', error);
      throw error;
    }
  }

  /**
   * Send a message to a channel.
   * @param {string} channelId - The ID of the channel
   * @param {Object} payload - Message payload (including components, content, etc.)
   * @returns {Promise<Object>} - The created message
   */
  static async sendMessage(channelId, payload) {
    return this.sendRequest(`/channels/${channelId}/messages`, 'POST', payload);
  }

  /**
   * Edit a message.
   * @param {string} channelId - The ID of the channel
   * @param {string} messageId - The ID of the message
   * @param {Object} payload - New message payload
   * @returns {Promise<Object>} - The edited message
   */
  static async editMessage(channelId, messageId, payload) {
    return this.sendRequest(`/channels/${channelId}/messages/${messageId}`, 'PATCH', payload);
  }

  /**
   * Delete a message.
   * @param {string} channelId - The ID of the channel
   * @param {string} messageId - The ID of the message
   * @returns {Promise<null>}
   */
  static async deleteMessage(channelId, messageId) {
    return this.sendRequest(`/channels/${channelId}/messages/${messageId}`, 'DELETE');
  }

  /**
   * Send an interaction callback response.
   * @param {string} interactionId - The ID of the interaction
   * @param {string} interactionToken - The token of the interaction
   * @param {Object} payload - The interaction response payload
   * @returns {Promise<null>}
   */
  static async sendInteractionResponse(interactionId, interactionToken, payload) {
    return this.sendRequest(`/interactions/${interactionId}/${interactionToken}/callback`, 'POST', payload);
  }

  /**
   * Edit the original interaction response.
   * @param {string} applicationId - The ID of the application
   * @param {string} interactionToken - The token of the interaction
   * @param {Object} payload - The new message payload
   * @returns {Promise<Object>} - The edited message
   */
  static async editOriginalInteractionResponse(applicationId, interactionToken, payload) {
    return this.sendRequest(`/webhooks/${applicationId}/${interactionToken}/messages/@original`, 'PATCH', payload);
  }

  /**
   * Create a followup message for an interaction.
   * @param {string} applicationId - The ID of the application
   * @param {string} interactionToken - The token of the interaction
   * @param {Object} payload - The message payload
   * @returns {Promise<Object>} - The created message
   */
  static async sendFollowupMessage(applicationId, interactionToken, payload) {
    return this.sendRequest(`/webhooks/${applicationId}/${interactionToken}`, 'POST', payload);
  }
}
