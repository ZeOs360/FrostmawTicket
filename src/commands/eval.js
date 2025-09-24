const { SlashCommandBuilder } = require('discord.js');
const config = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Kod çalıştırır (sadece developer)')
    .addStringOption(option =>
      option.setName('kod')
        .setDescription('Çalıştırılacak kod')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (interaction.user.id !== config.developerId) {
      return interaction.reply({ content: 'Bu komutu sadece developer kullanabilir.', ephemeral: true });
    }
    const kod = interaction.options.getString('kod');
    try {
      let sonuç = await eval(`(async () => { ${kod} })()`);
      if (typeof sonuç !== 'string') sonuç = require('util').inspect(sonuç);
      if (sonuç.includes(config.token)) sonuç = 'Güvenlik: Token gösterilmiyor!';
      if (sonuç.length > 1900) sonuç = sonuç.slice(0, 1900) + '\n...çıktı kısaltıldı...';
      await interaction.reply({ content: `\`\`\`js\n${sonuç}\n\`\`\``, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `Hata: \`\`\`js\n${err}\n\`\`\``, ephemeral: true });
    }
  }
};