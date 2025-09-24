const { SlashCommandBuilder } = require('discord.js');
const config = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reboot')
    .setDescription('Botu yeniden başlatır (sadece developer)'),
  async execute(interaction) {
    if (interaction.user.id !== config.developerId) {
      return interaction.reply({ content: 'Bu komutu sadece developer kullanabilir.', ephemeral: true });
    }
    await interaction.reply({ content: 'Bot yeniden başlatılıyor...', ephemeral: true });
    process.exit(0);
  }
};