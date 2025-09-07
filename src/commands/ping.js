const { SlashCommandBuilder } = require('discord.js');
const config = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun gecikmesini gösterir (sadece developer)'),
  async execute(interaction) {
    if (interaction.user.id !== config.developerId) {
      return interaction.reply({ content: 'Bu komutu sadece developer kullanabilir.', ephemeral: true });
    }
    await interaction.reply({ content: `🏓 Ping: ${interaction.client.ws.ping}ms`, ephemeral: true });
  }
};