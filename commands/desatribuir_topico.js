const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desatribuir_topico')
        .setDescription('Desatribui o tópico atual, removendo as iniciais e mudando o emoji para azul.'),
    async execute(interaction) {
        // CORREÇÃO AQUI: Usando flags: 64 para o deferReply
        await interaction.deferReply({ flags: 64 });

        if (interaction.channel.type !== ChannelType.PublicThread && interaction.channel.type !== ChannelType.PrivateThread) {
            return interaction.editReply({ content: 'Este comando só pode ser usado dentro de um tópico (thread).' });
        }

        const currentThread = interaction.channel;
        const oldTitle = currentThread.name;

        let cleanedTitle = oldTitle;

        if (oldTitle.startsWith("🟡 [")) {
            const match = oldTitle.match(/^🟡 \[.*?\] - (.*)/);
            if (match && match[1]) {
                cleanedTitle = match[1].trim();
            }
        } else if (oldTitle.startsWith("🔵 ") || oldTitle.startsWith("🟢 ")) {
            cleanedTitle = oldTitle.substring(2).trim();
        }

        const maxCleanedTitleLength = 100 - 2; 
        const finalCleanedTitle = cleanedTitle.length > maxCleanedTitleLength ?
                                   cleanedTitle.substring(0, maxCleanedTitleLength).trim() :
                                   cleanedTitle;

        const newTitle = `🔵 ${finalCleanedTitle}`;

        try {
            await interaction.editReply({ content: '⏳ Desatribuindo tópico...' });
            await currentThread.setName(newTitle, `Tópico desatribuído por ${interaction.user.tag}`);
            // Removido 'ephemeral: false' para mensagens públicas.
            await interaction.editReply({ content: `Tópico desatribuído! Novo título: \`${newTitle}\`` });
        } catch (error) {
            console.error('Erro ao desatribuir tópico:', error);
            if (error.code === 50013) {
                await interaction.editReply({ content: 'Não tenho permissão para renomear este tópico. Verifique as permissões do bot.' });
            } else {
                await interaction.editReply({ content: `Ocorreu um erro ao desatribuir o tópico: ${error.message}` });
            }
        }
    },
};