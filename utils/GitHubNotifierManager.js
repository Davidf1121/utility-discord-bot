import { createLogger } from './Logger.js';
import { EmbedBuilder } from 'discord.js';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { saveConfig, getDefaultThumbnail } from './ConfigLoader.js';

export class GitHubNotifierManager {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.logger = createLogger('GitHubNotifier');
    this.app = express();
    this.server = null;
  }

  start() {
    if (!this.config.github?.enabled) {
      this.logger.info('GitHub notifier is disabled in config');
      return;
    }

    const port = this.config.github.port || 3000;
    const secret = this.config.github.secret;

    this.app.use(bodyParser.json({
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));

    const webhookPath = this.config.github?.webhookPath || '/github-webhook';

    this.app.post(webhookPath, (req, res) => {
      this.logger.debug('Received GitHub webhook');

      if (secret) {
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) {
          this.logger.warn('No signature found in request headers');
          return res.status(401).send('No signature');
        }

        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

        if (signature !== digest) {
          this.logger.warn('Invalid signature');
          return res.status(401).send('Invalid signature');
        }
      }

      const event = req.headers['x-github-event'];
      this.handleEvent(event, req.body);
      res.status(200).send('OK');
    });

    this.server = this.app.listen(port, () => {
      this.logger.info(`GitHub webhook server listening on port ${port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.logger.info('Stopped GitHub webhook server');
    }
  }

  async handleEvent(event, data) {
    this.logger.info(`Handling GitHub event: ${event}`);

    try {
      let embed = null;

      switch (event) {
        case 'push':
          embed = this.createPushEmbed(data);
          break;
        case 'pull_request':
          embed = this.createPullRequestEmbed(data);
          break;
        case 'issues':
          embed = this.createIssueEmbed(data);
          break;
        default:
          this.logger.debug(`Unhandled GitHub event: ${event}`);
          return;
      }

      if (embed) {
        await this.sendNotification(embed);
      }
    } catch (error) {
      this.logger.error(`Error handling GitHub event ${event}:`, error);
    }
  }

  async sendNotification(embed) {
    const channelId = this.config.github.notificationChannelId;
    
    if (!channelId) {
      this.logger.warn('No GitHub notification channel configured, skipping notification');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel) {
        this.logger.warn(`GitHub notification channel not found: ${channelId}`);
        return;
      }

      await channel.send({ embeds: [embed] });
      this.logger.info('Sent GitHub notification');
    } catch (error) {
      this.logger.error('Error sending GitHub notification:', error);
    }
  }

  createPushEmbed(data) {
    if (!data.commits || data.commits.length === 0) return null;

    const repository = data.repository?.full_name || 'unknown/repository';
    const branch = data.ref ? data.ref.split('/').pop() : 'unknown';
    const commitsCount = data.commits.length;
    const pusher = data.pusher?.name || data.sender?.login || 'unknown';
    const pusherAvatar = data.sender?.avatar_url || '';

    const embed = new EmbedBuilder()
      .setColor(this.config.github.embedColors?.push || this.config.embedColors?.github || 5793287)
      .setAuthor({ name: pusher, iconURL: pusherAvatar, url: data.sender?.html_url })
      .setTitle(`[${repository}:${branch}] ${commitsCount} new commit${commitsCount > 1 ? 's' : ''}`)
      .setURL(data.compare || data.commits[0].url)
      .setTimestamp(new Date());

    const commitList = data.commits.map(commit => {
      const shortId = commit.id.substring(0, 7);
      return `[\`${shortId}\`](${commit.url}) ${commit.message.split('\n')[0]} - ${commit.author?.name || 'unknown'}`;
    }).slice(0, 5).join('\n');

    embed.setDescription(commitList + (commitsCount > 5 ? `\n...and ${commitsCount - 5} more` : ''));

    return embed;
  }

  createPullRequestEmbed(data) {
    const { action, pull_request, repository, sender } = data;
    if (!pull_request) return null;

    const prUrl = pull_request.html_url;
    const prTitle = pull_request.title;
    const prNumber = pull_request.number;

    const embed = new EmbedBuilder()
      .setColor(this.config.github.embedColors?.pull_request || this.config.embedColors?.github || 5783218)
      .setAuthor({ name: sender?.login || 'unknown', iconURL: sender?.avatar_url, url: sender?.html_url })
      .setTitle(`[${repository?.full_name || 'repo'}] Pull Request ${action}: #${prNumber} ${prTitle}`)
      .setURL(prUrl)
      .setTimestamp(new Date(pull_request.updated_at || pull_request.created_at));

    if (action === 'opened' || action === 'reopened') {
      embed.setDescription(pull_request.body?.substring(0, 500) || 'No description provided');
    } else if (action === 'closed' && pull_request.merged) {
      embed.setTitle(`[${repository?.full_name || 'repo'}] Pull Request merged: #${prNumber} ${prTitle}`);
      embed.setColor(0x6f42c1); // GitHub purple for merged PRs
    }

    return embed;
  }

  createIssueEmbed(data) {
    const { action, issue, repository, sender } = data;
    if (!issue) return null;

    const issueUrl = issue.html_url;
    const issueTitle = issue.title;
    const issueNumber = issue.number;

    const embed = new EmbedBuilder()
      .setColor(this.config.github.embedColors?.issues || this.config.embedColors?.github || 15548997)
      .setAuthor({ name: sender?.login || 'unknown', iconURL: sender?.avatar_url, url: sender?.html_url })
      .setTitle(`[${repository?.full_name || 'repo'}] Issue ${action}: #${issueNumber} ${issueTitle}`)
      .setURL(issueUrl)
      .setTimestamp(new Date(issue.updated_at || issue.created_at));

    if (action === 'opened' || action === 'reopened') {
      embed.setDescription(issue.body?.substring(0, 500) || 'No description provided');
    }

    return embed;
  }

  async updateConfig(newConfig) {
    this.config.github = { ...this.config.github, ...newConfig };
    
    // Restart if necessary (port changed)
    if (newConfig.port && this.server) {
      this.stop();
      this.start();
    } else if (newConfig.enabled === true && !this.server) {
      this.start();
    } else if (newConfig.enabled === false && this.server) {
      this.stop();
    }
    
    await saveConfig(this.config);
    return { success: true, message: 'GitHub config updated and saved' };
  }
  
  async sendTestPushNotification() {
    const testData = {
      ref: 'refs/heads/main',
      repository: { full_name: 'test-org/test-repo' },
      pusher: { name: 'testuser' },
      sender: { 
        login: 'testuser', 
        avatar_url: 'https://github.com/github.png', 
        html_url: 'https://github.com/github' 
      },
      compare: 'https://github.com/test-org/test-repo/compare/abcdef...123456',
      commits: [
        {
          id: '1234567890abcdef',
          url: 'https://github.com/test-org/test-repo/commit/1234567890abcdef',
          message: 'Test commit message',
          author: { name: 'testuser' }
        }
      ]
    };
    
    const embed = this.createPushEmbed(testData);
    if (embed) {
      await this.sendNotification(embed);
    }
  }
}
