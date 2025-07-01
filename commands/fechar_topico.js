const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fechar_topico')
        .setDescription('Fecha o tópico atual (muda o emoji para verde), mantendo o título existente.'),
    async execute(interaction) {
        // CORREÇÃO AQUI: Usando flags: 64 para o deferReply
        await interaction.deferReply({ flags: 64 });

        if (interaction.channel.type !== ChannelType.PublicThread && interaction.channel.type !== ChannelType.PrivateThread) {
            return interaction.editReply({ content: 'Este comando só pode ser usado dentro de um tópico (thread).' });
        }

        const currentThread = interaction.channel;
        const oldTitle = currentThread.name;

        let baseTitle = oldTitle;
        if (oldTitle.startsWith("🔵 ")) {
            baseTitle = oldTitle.substring(2).trim();
        } else if (oldTitle.startsWith("🟢 ")) {
            baseTitle = oldTitle.substring(2).trim();
        } else if (oldTitle.startsWith("🟡 [")) {
            baseTitle = oldTitle.substring(2).trim();
        }

        const newTitle = `🟢 ${baseTitle}`;

        try {
            await interaction.editReply({ content: '⏳ Fechando o tópico... isso pode levar alguns minutos.' });
            await currentThread.setName(newTitle, `Tópico fechado por ${interaction.user.tag}`);
            await interaction.editReply({ content: `Tópico fechado! Novo título: \`${newTitle}\``});
        } catch (error) {
            console.error('Erro ao fechar tópico:', error);
            if (error.code === 50013) {
                await interaction.editReply({ content: 'Não tenho permissão para renomear este tópico. Verifique as permissões do bot.' });
            } else {
                await interaction.editReply({ content: `Ocorreu um erro ao fechar o tópico: ${error.message}` });
            }
        }
    },
};