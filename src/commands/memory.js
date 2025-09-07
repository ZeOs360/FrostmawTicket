const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memory')
    .setDescription('Botun RAM kullanımını gösterir (sadece developer)'),
  async execute(interaction) {
    const config = require('../utils/config');
    if (interaction.user.id !== config.developerId) {
      return interaction.reply({ content: 'Bu komutu sadece developer kullanabilir.', ephemeral: true });
    }
    const used = process.memoryUsage();
    await interaction.reply({
      content: `RAM Kullanımı: ${(used.rss / 1024 / 1024).toFixed(2)} MB`,
      ephemeral: true
    });
  }
};