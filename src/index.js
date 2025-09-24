const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');
const chalk = require('chalk');
const config = require('./utils/config');
const fs = require('fs');
const path = require('path');
const handleTicketInteraction = require('./handlers/ticketHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Komutları yükle
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
  : [];
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  console.log(chalk.greenBright(`✅ Engine: ${chalk.bold(command.data.name)}`));
}

client.on('interactionCreate', async interaction => {
  // Slash komutları çalıştır
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: 'Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type') {
    if (interaction.values[0] === 'reset') {
      try {
        // Kullanıcıya sadece kendisinin göreceği mesaj gönder
        await interaction.reply({
          content: 'Destek paneli başarıyla resetlendi! ✅',
          ephemeral: true
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      // Diğer ticket seçeneklerini tickethandler.js'e gönder
  handleTicketInteraction(interaction);
    }
    return;
  }

  // Ticket buton etkileşimlerini yönlendir
  if (
    interaction.isButton() &&
    ['lock_ticket', 'close_ticket', 'take_ticket'].includes(interaction.customId)
  ) {
    try {
      handleTicketInteraction(interaction);
    } catch (err) {
      console.error('Button interaction handling failed:', err);
    }
  }
});


client.once("ready", () => {
  client.user.setPresence({
    activities: [
      { name: "Frostmaw diyarında ❄️", type: ActivityType.PLAYING }
    ],
    status: "online" // "online" | "idle" | "dnd" | "invisible"
  });
  
});

// Bot açıldığında ticket panelini otomatik gönder
const panelMessagePath = path.join(__dirname, 'panelMessageId.json');
client.once('ready', async () => {
  console.log(chalk.green(`✅ All systems online: ${client.user.tag}`));
  const channel = await client.channels.fetch('1413947721299136794'); //  The channel ID to which the ticket panel will be sent
  let oldMessageId = null;

  // Eski panel mesajını sil
  if (fs.existsSync(panelMessagePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(panelMessagePath, 'utf8'));
      oldMessageId = data.messageId;
      if (oldMessageId) {
        const oldMsg = await channel.messages.fetch(oldMessageId).catch(() => null);
        if (oldMsg) await oldMsg.delete();
      }
    } catch (err) {
      console.error('Panel mesajı silinemedi:', err);
    }
  }

  // Yeni paneli gönder
  const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setTitle('<:frostmaw:1414021933011435593> Destek Paneli')
    .setDescription(
      `🔶 **Aşağıdaki menüden ihtiyacınıza uygun destek türünü seçerek ticket açabilirsiniz.**\n\n` +
      `🔹 Lütfen doğru kategoriyi seçtiğinizden emin olun. Ticket açtıktan sonra yaşadığınız sorunu veya talebinizi detaylı şekilde yazabilirsiniz. Yetkililer en kısa sürede sizinle ilgilenecektir.`
    )
    .setImage('https://cdn.discordapp.com/attachments/1413948363233169699/1414229697520209920/destek_banner.png?ex=68becf8b&is=68bd7e0b&hm=c362d43860465d228e4633e974bfd5704bd88313fb15a37c4005befb3415c7e1&')
    .setColor('#7EC0EE');
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_type')
    .setPlaceholder('Destek türü seçiniz')
    .addOptions([
      {
        label: 'Genel Destek',
        description: 'Sunucu ile ilgili genel sorularınız, sohbet ve bilgi talepleriniz için.',
        value: 'genel',
        emoji: '💬'
      },
      {
        label: 'Teknik Destek',
        description: 'Sunucuya erişim, hata, bağlantı veya teknik sorunlarınız için.',
        value: 'teknik',
        emoji: '🛠️'
      },
      {
        label: 'Sunucu İçi Destek',
        description: 'Minecraft Skyblock sunucusunda ada, eşyalar, görevler veya oyun içi sorunlarınız için.',
        value: 'sunucu',
        emoji: '🖥️'
      },
      {
        label: 'Şikayet',
        description: 'Kural ihlali, kullanıcı şikayetleri veya olumsuz durumlar için.',
        value: 'sikayet',
        emoji: '⚠️'
      },
      {
        label: 'Öneri',
        description: 'Sunucuya dair öneri, fikir ve geliştirme talepleriniz için.',
        value: 'oneri',
        emoji: '💡'
      },
      {
        label: 'Reset',
        description: 'Menüyü resetlemek için kullanabilirsiniz',
        value: 'reset',
        emoji: '⏪'
      },
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const sentMsg = await channel.send({ embeds: [embed], components: [row] });

  // Yeni panel mesajının ID’sini kaydet
  fs.writeFileSync(panelMessagePath, JSON.stringify({ messageId: sentMsg.id }));
});

client.login(config.token);
