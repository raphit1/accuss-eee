const express = require("express");
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events,
} = require("discord.js");
require("dotenv").config();

const app = express();
app.get("/", (req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur web lancé sur le port ${PORT}`));

// Ping Render pour éviter la mise en veille
setInterval(() => {
  require("http").get("https://TON-LIEN-RENDER.onrender.com");
}, 5 * 60 * 1000);

// IDs des salons
const SIGNAL_CHANNEL_ID = "1378660736150011956"; // Salon avec le bouton
const REPORT_CHANNEL_ID = "1378661323054776400"; // Salon où envoyer le rapport

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once("ready", async () => {
  console.log(`🤖 Connecté en tant que ${client.user.tag}`);

  const channel = await client.channels.fetch(SIGNAL_CHANNEL_ID);
  if (channel) {
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_report_modal")
        .setLabel("📋 Signaler quelqu’un")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      content: "**Signalez un comportement inapproprié via le formulaire ci-dessous :**",
      components: [button],
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && interaction.customId === "open_report_modal") {
    const modal = new ModalBuilder()
      .setCustomId("report_form")
      .setTitle("🚨 Fiche de signalement");

    const input1 = new TextInputBuilder()
      .setCustomId("accuse")
      .setLabel("Nom de l’accusé (@...)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const input2 = new TextInputBuilder()
      .setCustomId("crimes")
      .setLabel("Crimes reprochés")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const input3 = new TextInputBuilder()
      .setCustomId("contexte")
      .setLabel("Contexte du drame")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const input4 = new TextInputBuilder()
      .setCustomId("preuves")
      .setLabel("Preuves (liens, screens...)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input1),
      new ActionRowBuilder().addComponents(input2),
      new ActionRowBuilder().addComponents(input3),
      new ActionRowBuilder().addComponents(input4)
    );

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "report_form") {
    const accuse = interaction.fields.getTextInputValue("accuse");
    const crimes = interaction.fields.getTextInputValue("crimes");
    const contexte = interaction.fields.getTextInputValue("contexte");
    const preuves = interaction.fields.getTextInputValue("preuves");

    const embed = new EmbedBuilder()
      .setTitle("🚨 Nouveau signalement")
      .addFields(
        { name: "👤 Nom de l’accusé", value: accuse },
        { name: "⚠️ Crimes reprochés", value: crimes },
        { name: "📜 Contexte", value: contexte },
        { name: "🧾 Preuves", value: preuves || "*Aucune preuve fournie*" }
      )
      .setColor(0xff0000)
      .setFooter({ text: `Signalé par ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ content: "📬 Votre signalement a été envoyé.", ephemeral: true });

    const reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID);
    if (reportChannel) {
      reportChannel.send({ embeds: [embed] });
    }
  }
});

client.login(process.env.TOKEN);
