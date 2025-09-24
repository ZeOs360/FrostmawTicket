const { SlashCommandBuilder } = require('discord.js');
const config = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Botun ne kadar süredir açık olduğunu gösterir (sadece developer)'),
  async execute(interaction) {
    if (interaction.user.id !== config.developerId) {
      return interaction.reply({ content: 'Bu komutu sadece developer kullanabilir.', ephemeral: true });
    }
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    await interaction.reply({ content: `Uptime: ${hours} saat, ${minutes} dakika, ${seconds} saniye`, ephemeral: true });
  }
};