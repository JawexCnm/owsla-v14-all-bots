const { Client, Message } = require('discord.js');

/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @param {string[]} params 
 */
exports.run = async function(client, message, params) {
    if (!message.guild) return;
    if (!client.ayarlar.sahip.includes(message.author.id)) return;

    if (params[0]) {
        let commandName = params[0].toLowerCase();
        try {
            delete require.cache[require.resolve(`./${commandName}.js`)];
            client.commands.delete(commandName);
            const pull = require(`./${commandName}.js`);
            client.commands.set(commandName, pull);
        } catch (e) {
            return message.channel.send(`Bir hata oluştu ve **${commandName}** adlı komut reloadlanamadı.`);
        }

        message.channel.send(`__**${commandName}**__ adlı komut yeniden başlatılıyor!`)
            .then(x => setTimeout(() => x.delete().catch(() => { }), 5000))
            .catch(() => { });

        return;
    }

    message.channel.send(`__**Bot**__ yeniden başlatılıyor!`).then(msg => {
        console.log('[BOT] Yeniden başlatılıyor...');
        process.exit(0);
    }).catch(() => { });
};

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['reload', 'reboot', 'yenile', 'restart'],
    permLevel: 4
};

exports.help = {
    name: 'yenile',
    description: "Botu yeniden başlatmaya yarar",
    usage: 'yenile',
    kategori: "Bot Yapımcısı"
};
