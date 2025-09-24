# FrostmawTicket
  
Frostmaw Ticket is a modern Discord bot that provides automatic ticket management and support for the Frostmaw Gaming Community.  
Developed to support game servers, it is fully functional with Node.js and Discord.js.
This bot is based on Turkish text. You can change it to different languages and use it.
<div align="center">
  
![Frostmaw Logo](https://github.com/user-attachments/assets/8e8380b2-8524-4f68-8cc5-7a0753cba780)


![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Status](https://img.shields.io/badge/status-Educational-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.5--final-orange?style=for-the-badge)
</div>
<div align="center">
  
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>
<div align="center">
  
[⭐ Star this repo on GitHub](https://github.com/ZeOs360/FrostmawTicket/stargazers)

</div>

## 1. Setup / Getting Started

Steps for users to run the project:

```bash
git clone https://github.com/ZeOs360/FrostmawTicket.git
cd FrostmawTicket
npm install
```

## 2. Setting up Config Files

```js
module.exports = {
  token: 'TOKEN',
  clientId: 'clientId',
  guildId: 'guildId',
  ticketCategoryId: 'ticketCategoryId',
  logChannelId: 'logChannelId',
  headAdminRoleId: 'headAdminRoleId',
  adminRoleId: 'adminRoleId',
  headHelperRoleId: 'headHelperRoleId',
  helperRoleId: 'helperRoleId',
  developerId: 'developerId'
};
```

This file contains the bot's basic settings.
- `token`: Your bot token
- `clientId`: Your bot's client ID
- `guildId`: your server's guild ID.
- `ticketCategoryId`: The category ID where ticket channels are stored.
- `logChannelId`: The log channel ID for transcripts.
- `headAdminRoleId`: Head admin role
- `adminRoleId`: Admin role
- `headHelperRoleId`: Head helper role
- `helperRoleId`: Helper role
- `developerId`: Your Discord ID

- `headAdminRoleId`, `adminRoleId`, `headHelperRoleId` and `helperRoleId` are essentially just administrator role IDs. They are fully customizable and can be used if necessary.



## Features
- Automatically sends Support Panel messages to the channel by pulling the ID from the config.
- Quick notifications to authorized personnel
- User-friendly interface and commands
- Runs smoothly on any system thanks to minimal memory and CPU usage.

