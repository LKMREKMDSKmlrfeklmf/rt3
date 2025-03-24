const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
});

// الإعدادات الأساسية
const ORDERS_CHANNEL_ID = "1353435445232537631";
const TICKET_CHANNEL_ID = "1353435445232537631";

client.once("ready", () => {
    console.log(`✅ البوت جاهز! (${client.user.tag})`);
    client.user.setActivity("Respect Samp", { type: ActivityType.Playing });
});

// إرسال رسالة التقديم
client.on("messageCreate", async (message) => {
    if (message.content === "!rt" && message.member.permissions.has("Administrator")) {
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle("تقديم فتح عصابة ☈ ")
            .setDescription("🔴 اضغط على الزر لتقديم طلبك")
            .setFooter({ text: "Respect Samp" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("submit_request")
                .setLabel("📩 فتح عصابة ")
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// عرض نموذج التقديم
client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton() && interaction.customId === "submit_request") {
        const modal = new ModalBuilder()
            .setCustomId("request_form")
            .setTitle("📋 تقديم فتح عصابة");

        // إنشاء المدخلات المطلوبة
        const inputs = [
            ["gang_name", "📌 Name:", "أدخل اسم العصابة"],
            ["gang_color", "🎨 Color:", "مثال: أحمر، أزرق، أخضر"],
            ["gang_members", "👥 Members[Rp]:", "عدد الأعضاء [Rp]:"],
            ["gang_location", "📍 Location:", "أدخل موقع العصابة في السيرفر"],
            ["gang_money", "💰 Money:", "فلوس العصابة"]
        ];

        // إضافة المدخلات للنموذج
        inputs.forEach(([id, label, placeholder]) => {
            const input = new TextInputBuilder()
                .setCustomId(id)
                .setLabel(label)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
        });

        await interaction.showModal(modal);
    }
});

// معالجة تقديم الطلب
client.on("interactionCreate", async (interaction) => {
    if (interaction.isModalSubmit() && interaction.customId === "request_form") {
        const gangName = interaction.fields.getTextInputValue("gang_name");
        const gangColor = interaction.fields.getTextInputValue("gang_color");
        const gangMembers = interaction.fields.getTextInputValue("gang_members");
        const gangLocation = interaction.fields.getTextInputValue("gang_location");
        const gangMoney = interaction.fields.getTextInputValue("gang_money");

        const orderChannel = await client.channels.fetch(ORDERS_CHANNEL_ID);
        if (!orderChannel) return interaction.reply({ content: "⚠️ لم يتم العثور على قناة الطلبات!", ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle("📝 طلب فتح عصابة جديد")
            .setDescription(`👤 **المتقدم:** <@${interaction.user.id}>`)
            .addFields(
                { name: "📌 Name:", value: gangName, inline: false },
                { name: "🎨 Color:", value: gangColor, inline: false },
                { name: "👥 Members[Rp]:", value: gangMembers, inline: false },
                { name: "📍 Location:", value: gangLocation, inline: false },
                { name: "💰 Money:", value: gangMoney, inline: false }
            )
            .setFooter({ text: "Respect Samp • طلب عصابة جديد" })
            .setTimestamp();

        // إنشاء أزرار القبول والرفض مع معرف فريد
        const requestId = Date.now().toString();
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`approve_${interaction.user.id}_${requestId}`)
                .setLabel("✅ قبول")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`reject_${interaction.user.id}_${requestId}`)
                .setLabel("❌ رفض")
                .setStyle(ButtonStyle.Danger)
        );

        await orderChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({
            content: "✅ تم إرسال طلبك بنجاح! سيتم مراجعة طلبك من قبل الإدارة وإبلاغك بالنتيجة قريباً.",
            ephemeral: true
        });
    }
});

// معالجة أزرار القبول والرفض
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (!interaction.customId.startsWith('approve_') && !interaction.customId.startsWith('reject_')) return;

    await interaction.deferUpdate();

    const parts = interaction.customId.split("_");
    const action = parts[0];
    const discordId = parts[1];

    const member = await interaction.guild.members.fetch(discordId).catch(() => null);
    if (!member) return;

    const ticketChannel = await client.channels.fetch(TICKET_CHANNEL_ID).catch(() => null);

    // تعطيل الأزرار بعد القبول أو الرفض
    const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_${discordId}`).setLabel("✅ تم القبول").setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId(`reject_${discordId}`).setLabel("❌ تم الرفض").setStyle(ButtonStyle.Danger).setDisabled(true)
    );

    await interaction.message.edit({ components: [disabledRow] });

    const resultEmbed = new EmbedBuilder()
        .setColor(action === "approve" ? 0x00FF00 : 0xFF0000)
        .setTitle(action === "approve" ? "✅ تم قبول طلب العصابة" : "❌ تم رفض طلب العصابة")
        .setDescription(`مرحباً <@${discordId}>, ${action === "approve" ? "تهانينا! تمت الموافقة على طلب العصابة الخاص بك. يرجى فتح تذكرة لاستكمال طلب فتح العصابة" : "نأسف لإبلاغك أنه تم رفض طلب العصابة الخاص بك."}`)
        .addFields({ name: "👮 المشرف:", value: `<@${interaction.user.id}>`, inline: false })
        .setFooter({ text: "Respect Samp • نظام العصابات" })
        .setTimestamp();

    try {
        await member.send({ embeds: [resultEmbed] });
    } catch (error) {
        console.error("❌ لا يمكن إرسال رسالة خاصة للعضو:", error);
    }

    if (ticketChannel) {
        await ticketChannel.send({ embeds: [resultEmbed] });
    }
});

client.login("MTM1MzQzMjUxNTkxODE2ODE4Ng.G8AaxH.4alTjxbW_0895vmui8Oo6KDox7a_0ibRaGKzF4");
