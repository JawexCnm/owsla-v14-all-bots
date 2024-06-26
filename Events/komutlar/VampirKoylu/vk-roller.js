const { EmbedBuilder } = require("discord.js");
const vampirKoylu = require("../../models/vampirKoylu");
const sunucuayar = require("../../models/sunucuayar");
const moment = require("moment");

exports.run = async (client, message, args, durum, kanal) => {
    if (!message.guild) return;

    let data2 = await sunucuayar.findOne({});
    const vkyonetici = data2.VKAuthor;
    const prefix = client.ayarlar.prefix[0];

    if (!message.member.roles.cache.has(vkyonetici) && !message.member.permissions.has("Administrator")) 
        return message.reply("Yönetici ya da VK Sorumlusu olman gerekiyor!");

    if (!message.member.voice.channel) 
        return message.reply("Hata: Bu komutu kullanabilmek için bir ses kanalında olmanız gerekiyor");

    let data = await vampirKoylu.findOne({ Guild: message.guild.id });
    if (!data) return message.reply("Lütfen bir lobi oluşturunuz");

    let authorID = data.Lobby.filter(veri => veri.Channel === message.member.voice.channel.id && veri.Type === true && veri.Author).map(user => user.Author);
    if (!authorID.some(user => user == message.author.id)) 
        return message.reply("Oyunu sadece oyun başlatıcı bitirebilir!");

    let sestekiUyeler = Array.from(message.member.voice.channel.members.values()).filter(member => !member.voice.serverDeaf && message.member.id != member.id);
    if (sestekiUyeler.length < 5) 
        return message.channel.send("Bu oyunun başlayabilmesi için 5'den fazla üye olması gerekiyor!");

    let roller = ["vampir", "büyücü", "jester", "retri"];

    if (!args[0]) 
        return message.reply(`Lütfen geçerli bir rol belirtiniz (\`${prefix}vkroller 2vampir 1büyücü 1jester\`) gibi yapabilirsiniz`);

    let filteredArgs = args.filter(e => roller.some(rol => rol == e.substring(1).toLowerCase()));
    let rolesCount = filteredArgs.map(e => ({ Name: e.substring(1), Count: Number(e.charAt(0)) }));
    let _roles = [];
    let roltoplam = 0;

    filteredArgs.forEach(farg => {
        let num = Number(farg.charAt(0));
        if (!isNaN(num)) {
            for (let i = 0; i < num; i++)
                _roles.push(farg.substring(1));
            roltoplam += num;
        }
    });

    shuffle(sestekiUyeler);
    shuffle(_roles);

    let listed = {};
    let koylutoplam = 0;

    sestekiUyeler.forEach((member, index) => {
        if (_roles[index])
            listed[member.id] = _roles[index];
        else
            listed[member.id] = "Köylü";
        koylutoplam += 1;
    });

    let durumlisted = { ...listed };

    await vampirKoylu.findOne({ Guild: message.guild.id }, async (err, veri) => {
        if (!veri) return;

        let data = veri.Lobby;
        let data2 = veri.Oyun;
        let authorID = data.filter(veri => veri.Channel === message.member.voice.channel.id && veri.Type === true && veri.Author).map(user => user.Author);

        if (!authorID.some(user => user === message.author.id)) 
            return message.reply("Rolleri sadece Lobi sahibi dağıtabilir!");

        if (data2.filter(x => data.map(x => x.Channel).some(kanal => kanal === message.member.voice.channel.id) && x.Durum === true).map(x => x.Channel).some(kontrol => kontrol === message.member.voice.channel.id)) {
            return message.reply("Lütfen zaten başlayan bir oyunu tekrardan başlatmaya çalışmayınız!");
        }

        if (!data.map(x => x.Channel).some(kanal => kanal === message.member.voice.channel.id)) 
            return message.channel.send({ embeds: [new EmbedBuilder().setColor("RED").setDescription(`Oyunu başlatmak için bir lobi oluşturmalısınız! (\`${prefix}vkstart\`)`)] });

        const rollerEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Oyun Başladı', iconURL: message.author.displayAvatarURL() })
            .setColor('RANDOM')
            .setFooter({ text: client.ayarlar.footer })
            .setTimestamp()
            .setDescription(`
                **Dağıtılan Roller: (\`${koylutoplam} adet\`)**
                
                **Köylü** (\`${koylutoplam - roltoplam}\`)-${rolesCount.map(x => `**${capitalize(x.Name)}** (\`${x.Count}\`)`).join("-")}
                
                **Dağıtılan Oyuncular:**
                ${Object.keys(listed).length < 60 ? sestekiUyeler.map(member => `${member.displayName} [${capitalize(listed[member.id])}]`).join("\n") : "Katılımcı sayısı çok fazla olduğu için şuan da listelenemiyor"}
            `);
        message.channel.send({ embeds: [rollerEmbed] });

        sestekiUyeler.forEach((member, index) => {
            Object.keys(listed).filter(user => user === member.id).forEach(async (user, idx) => {
                setTimeout(async () => {
                    try {
                        await client.users.cache.get(user).send(`🔸 ${moment(Date.now()).locale("tr").format("LLL")} tarihinde başlatılmış, **${message.guild.members.cache.get(authorID[0]).displayName}** (<@${authorID[0]}>) tarafından yönetilen, #${veri.ID} ID'li oyundaki rolünüz:\n\n\`\`\`${capitalize(listed[user])}\`\`\``);
                    } catch (err) {
                        message.channel.send(`<@${user}> üyesine özelden mesaj gönderemiyorum! Rolünü öğrenmek için oyun yöneticisine özelden sorsun.`).catch(console.error);
                    }
                }, idx * 1000);
            });
        });

        let liste = Object.keys(listed).map(e => `${message.guild.members.cache.get(e).displayName} [${capitalize(listed[e])}]`);

        message.author.send({
            content: liste.join("\n"),
            split: true,
            code: "md"
        }).then(() => {
            veri.Oyun.push({
                ID: veri.ID,
                Zaman: "Gündüz",
                Gun: 1,
                Durum: true,
                Channel: message.member.voice.channel.id,
                Liste: listed,
                Yasayanlar: durumlisted,
                Oluler: {},
                Start: Date.now(),
                Finish: Date.now()
            });
            veri.save();
        }).catch(err => {
            message.channel.send(`<@${message.author.id}> üyesine özelden mesaj gönderemiyorum! Rolünü öğrenmek için oyun yöneticisine özelden sorsun.`).catch(console.error);
        });
    });
};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: ["vkroller"],
    permLevel: 0
};

exports.help = {
    name: 'vkroller',
    description: 'Vampir köylü oyununu başlatmaya yaramaktadır',
    usage: 'vkroller',
    kategori: 'Vampir Koylu'
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function capitalize(s) {
    let x = s.toLowerCase();
    if (typeof x !== 'string') return '';
    return x.charAt(0).toUpperCase() + x.slice(1);
}

function lengthByArray(arr, result = {}) {
    arr.forEach(e => result[e] ? result[e]++ : result[e] = 1);
    return result;
}
