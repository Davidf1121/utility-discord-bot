import { createLogger } from '../utils/Logger.js';

const logger = createLogger('VoiceStateEvent');

export default {
  name: 'voiceStateUpdate',
  execute(oldState, newState) {
    const client = newState.client;
    const tempChannelManager = client.tempChannelManager;
    
    if (!tempChannelManager.config.features.tempVoiceChannels) return;
    
    const config = tempChannelManager.config;
    const voiceCategoryId = config.voiceCategoryId;
    
    if (!voiceCategoryId) return;
    
    const isNewChannel = newState.channelId !== oldState.channelId;
    const userLeft = !newState.channel && oldState.channel;
    const userJoined = newState.channel && !oldState.channel;
    const userMoved = newState.channel && oldState.channel && newState.channelId !== oldState.channelId;
    
    if (userLeft || userMoved) {
      if (oldState.channel && oldState.channelId === voiceCategoryId) return;
      
      if (oldState.channel && oldState.channel.parentId === voiceCategoryId) {
        if (oldState.channelId && tempChannelManager.isTempChannel(oldState.channelId)) {
          const membersLeft = oldState.channel.members.size;
          
          if (membersLeft === 0) {
            logger.info(`Last user left temp channel ${oldState.channelId}`);
            tempChannelManager.scheduleDeletion(oldState.channel);
          } else {
            logger.debug(`Channel ${oldState.channelId} still has ${membersLeft} member(s)`);
          }
        }
      }
    }
    
    if (userJoined || userMoved) {
      if (newState.channelId === voiceCategoryId) {
        const guild = newState.guild;
        const userId = newState.member.user.id;
        const options = {
          name: `${newState.member.user.username}'s Channel`,
          categoryId: voiceCategoryId
        };
        
        tempChannelManager.createTempChannel(guild, userId, options)
          .then(channel => {
            if (channel) {
              newState.member.voice.setChannel(channel.id)
                .then(() => {
                  logger.info(`Moved user ${userId} to temp channel ${channel.id}`);
                })
                .catch(error => {
                  logger.error('Error moving user to temp channel:', error);
                });
            }
          });
      }
      
      if (newState.channel && tempChannelManager.isTempChannel(newState.channelId)) {
        tempChannelManager.cancelDeletion(newState.channelId);
        logger.debug(`User joined temp channel ${newState.channelId}, deletion cancelled`);
      }
    }
  }
};
