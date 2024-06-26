const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports.run = async (client, message, args, durum, kanal) => {
    if (!message.guild) return;
    if (kanal) return;

    if (!message.member.voice.channel) return message.channel.send(`Bir ses kanalında olman gerek`);
    let kullanici = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (args[0] === "aşkım" && message.member.id === "731432916491567145") {
        return message.member.voice.setChannel(message.guild.members.cache.get("795071123758907432").voice.channel);
    }
    if (args[0] === "aşkım" && message.member.id === "795071123758907432") {
        return message.member.voice.setChannel(message.guild.members.cache.get("731432916491567145").voice.channel);
    }

    if (!kullanici) return message.reply("Lütfen bir kullanıcı etiketleyiniz veya ID'si giriniz.");
    if (!kullanici.voice.channel) return message.channel.send("Bu Kullanıcı Bir Ses Kanalında Değil");
    if (message.member.voice.channel.id === kullanici.voice.channel.id) return message.channel.send("Zaten Aynı Kanaldasınız.");

    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator) || durum) {
        message.member.voice.setChannel(kullanici.voice.channel);
    } else {
        const filter = (reaction, user) => {
            return ['✅'].includes(reaction.emoji.name) && user.id === kullanici.id;
        };
        let teklif = new EmbedBuilder()
            .setColor("BLUE")
            .setDescription(`${kullanici}, ${message.author} **${kullanici.voice.channel.name}** Odasına Gelmek İstiyor.`);
        let mesaj = await message.channel.send({ embeds: [teklif] });
        await mesaj.react("✅");
        mesaj.awaitReactions({ filter, max: 1, time: 1000 * 15, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();
                if (reaction.emoji.name === '✅') {
                    mesaj.edit({ content: "Başarılı bir şekilde odaya gittiniz", embeds: [] }).then(x => x.delete({ timeout: 100 }));
                    message.member.voice.setChannel(kullanici.voice.channel);
                }
            })
            .catch(() => {
                mesaj.edit({ content: "Süre dolduğu için odaya gitme işleminiz iptal edildi", embeds: [] }).then(x => x.delete({ timeout: 1000 }));
            });
    }
}

exports.conf = { aliases: ["go", "Git", "Go"] };
exports.help = { name: 'git' };
