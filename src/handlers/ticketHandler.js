const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const transcript = require('discord-html-transcripts');
const config = require('../utils/config');
const fs = require('fs');
const path = require('path');
const counterFile = path.join(__dirname, '..', 'ticketCounter.json');

// Ticket bilgilerini dosyada tutmak için
const ticketsFile = path.join(__dirname, '..', 'activeTickets.json');
function loadTickets() {
  if (!fs.existsSync(ticketsFile)) return {};
  return JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
}
function saveTickets(tickets) {
  fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));
}

const { headAdminRoleId, adminRoleId, headHelperRoleId, helperRoleId } = config;

module.exports = async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type') {
    const ticketId = getNextTicketId();
    const selectedOption = interaction.component.options.find(opt => opt.value === interaction.values[0]);
    const destekTuruLabel = selectedOption ? selectedOption.label : interaction.values[0];
    const destekTuruValue = interaction.values[0];

    const userId = interaction.user.id;
    const tickets = loadTickets();

    for (const [channelId, ticket] of Object.entries(tickets)) {
      if (!interaction.guild.channels.cache.has(channelId)) {
        delete tickets[channelId];
      }
    }
    saveTickets(tickets);

    if (Object.values(tickets).find(t => t.userId === userId)) {
      return interaction.reply({ content: 'Zaten açık bir destek kaydınız var!', ephemeral: true });
    }

    const kanalAdi = `${interaction.user.username}-destek`;
    const acilisTarihi = new Date();

    const permissionOverwrites = [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ];

    [headAdminRoleId, adminRoleId, headHelperRoleId, helperRoleId].forEach(roleId => {
      if (roleId) {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        });
      }
    });

    const channel = await interaction.guild.channels.create({
      name: kanalAdi,
      type: ChannelType.GuildText,
      parent: config.ticketCategoryId,
      topic: destekTuruLabel,
      permissionOverwrites
    });

    const embed = new EmbedBuilder()
      .setTitle('<:frostmaw:1414021933011435593> Destek Talebiniz Oluşturuldu')
      .setDescription(
        `Konu: **${destekTuruLabel}**\n\n` +
        `🔹 Destek kanalınız başarıyla oluşturuldu. **Adminlerden cevap beklemeden** yaşadığınız sorunu veya talebinizi detaylı şekilde yazabilirsiniz.\n` +
        `🔹 **Yetkililer en kısa sürede** sizinle ilgilenecektir. Lütfen gereksiz mesaj atmaktan kaçının ve sabırlı olun.\n\n` +
        `🔹 Desteği kapatmak için aşağıdaki **KAPAT** butonunu kullanabilirsiniz.`
      )
      .setImage('https://cdn.discordapp.com/attachments/1413948363233169699/1414229697520209920/destek_banner.png?ex=68becf8b&is=68bd7e0b&hm=c362d43860465d228e4633e974bfd5704bd88313fb15a37c4005befb3415c7e1&')
      .setColor('#7EC0EE');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('lock_ticket')
        .setLabel('Kitle/Aç')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Kapat')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('take_ticket')
        .setLabel('Desteği Devral')
        .setStyle(ButtonStyle.Success)
    );

    const panelMsg = await channel.send({ content: `<@${userId}>`, embeds: [embed], components: [row] });
    tickets[channel.id] = {
      id : ticketId,
      userId,
      username: interaction.user.username,
      destekTuru: destekTuruLabel,
      acilisTarihi: acilisTarihi.toISOString(),
      devralanYetkili: null,
      panelMsgId: panelMsg.id
    };
    saveTickets(tickets);

    await interaction.reply({ content: `Ticket açıldı: ${channel}`, ephemeral: true });
    return;
  }

  if (interaction.isButton()) {
    const channel = interaction.channel;
    const tickets = loadTickets();
    const ticket = tickets[channel.id];
    
    if (!ticket) {
      console.log(`Ticket bulunamadı: ${channel.id}`);
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ 
          content: 'Bu kanal için ticket bilgileri bulunamadı.', 
          ephemeral: true 
        });
      }
      return;
    }

    const isAdmin = config.TicketRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

    if (interaction.customId === 'lock_ticket') {
      if (!isAdmin) {
        return await interaction.reply({ content: 'Sadece adminler bu işlemi yapabilir.', ephemeral: true });
      }

      // Önce interaction'ı defer et
      await interaction.deferUpdate();

      // Ticket üzerinde kilit bilgisi yoksa ekle
      if (ticket.locked === undefined) ticket.locked = false;

      // Durumu tersine çevir
      ticket.locked = !ticket.locked;

      // Kullanıcı izinlerini güncelle
      await channel.permissionOverwrites.edit(ticket.userId, {
        SendMessages: ticket.locked ? false : true
      });

      saveTickets(tickets);

      await channel.send(
        ticket.locked
          ? `Yetkili <@${interaction.user.id}> kanalı **kilitledi**.`
          : `Yetkili <@${interaction.user.id}> kanalı **açtı**.`
      );

      return;
    }

    if (interaction.customId === 'take_ticket') {
      if (!isAdmin) {
        return await interaction.reply({ content: 'Sadece adminler bu işlemi yapabilir.', ephemeral: true });
      }

      // Önce interaction'ı defer et
      await interaction.deferUpdate();

      ticket.devralanYetkili = {
        id: interaction.user.id,
        username: interaction.user.username
      };
      saveTickets(tickets);

      const panelMsg = await channel.messages.fetch(ticket.panelMsgId).catch(() => null);
      if (panelMsg) {
        const updatedEmbed = EmbedBuilder.from(panelMsg.embeds[0])
          .setDescription(
            `**Destek ID:** ${ticket.id}\n` +
            `Konu: **${ticket.destekTuru}**\nDevralan Yetkili: <@${interaction.user.id}> (${interaction.user.id})\n\n` +
            `🔹 Destek kanalınız başarıyla oluşturuldu. **Adminlerden cevap beklemeden** yaşadığınız sorunu veya talebinizi detaylı şekilde yazabilirsiniz.\n` +
            `🔹 **Yetkililer en kısa sürede** sizinle ilgilenecektir. Lütfen gereksiz mesaj atmaktan kaçının ve sabırlı olun.\n\n` +
            `🔹 Desteği kapatmak için aşağıdaki **KAPAT** butonunu kullanabilirsiniz.`
          );
        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('lock_ticket')
            .setLabel('Kitle/Aç')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false),
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Kapat')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(false),
          new ButtonBuilder()
            .setCustomId('take_ticket')
            .setLabel('Desteği Devral')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
        );
        await panelMsg.edit({ embeds: [updatedEmbed], components: [updatedRow] });
      }
      await channel.send(`Yetkili <@${interaction.user.id}> desteği **devraldı**.`);
      return;
    }

    if (interaction.customId === 'close_ticket') {
      if (!isAdmin && interaction.user.id !== ticket.userId) {
        return await interaction.reply({ content: 'Sadece adminler veya ticket sahibi kapatabilir.', ephemeral: true });
      }

      // Önce interaction'ı defer et
      await interaction.deferUpdate();

      const panelMsg = await channel.messages.fetch(ticket.panelMsgId).catch(() => null);
      if (panelMsg) {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('lock_ticket')
            .setLabel('Kitle/Aç')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Kapat')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('take_ticket')
            .setLabel('Desteği Devral')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
        );
        await panelMsg.edit({ components: [disabledRow] });
      }

      // Kapanma mesajı sadece metin, komponent yok
      await channel.send(`Yetkili <@${interaction.user.id}> ticketı **sonlandırdı**. Ticket 10 saniye sonra kapanacak, transcript hazırlanıyor...`);

      setTimeout(async () => {
        const kapanisTarihi = new Date();
        const transcriptFile = await transcript.createTranscript(channel, { fileName: `${channel.name}.html` });
        
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          await logChannel.send({
            files: [transcriptFile],
            content: 
              `**Destek ID:** ${ticket.id}\n` +
              `**Destek Türü:** ${ticket.destekTuru}\n` +
              `**Açılış:** ${new Date(ticket.acilisTarihi).toLocaleString('tr-TR')}\n` +
              `**Kapanış:** ${kapanisTarihi.toLocaleString('tr-TR')}\n` +
              `**Kapatan Yetkili:** <@${interaction.user.id}> (${interaction.user.id})\n` +
              `**Oluşturan Oyuncu:** <@${ticket.userId}> (${ticket.userId})\n` +
              `**Devralan Yetkili:** ${ticket.devralanYetkili ? `<@${ticket.devralanYetkili.id}> (${ticket.devralanYetkili.id})` : 'Devralan yok'}`
          });
        }

        delete tickets[channel.id];
        saveTickets(tickets);
        await channel.delete().catch(console.error);
      }, 10000);

      return;
    }
  }
};

function loadCounter() {
  if (!fs.existsSync(counterFile)) return { count: 0 };
  return JSON.parse(fs.readFileSync(counterFile, 'utf8'));
}

function saveCounter(counter) {
  fs.writeFileSync(counterFile, JSON.stringify(counter, null, 2));
}

function getNextTicketId() {
  const counter = loadCounter();
  counter.count += 1;
  saveCounter(counter);
  return `#${counter.count}`;
}
