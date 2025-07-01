const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('atribuir_topico')
        .setDescription('Atribui o tópico atual a um responsável.')
        .addStringOption(option =>
            option.setName('iniciais')
                .setDescription('As 2 primeiras letras do nome do responsável (ex: AB).')
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(2)),
    async execute(interaction) {
        // CORREÇÃO AQUI: Usando flags: 64 para o deferReply
        await interaction.deferReply({ flags: 64 });

        const iniciais = interaction.options.getString('iniciais').toUpperCase();

        if (interaction.channel.type !== ChannelType.PublicThread && interaction.channel.type !== ChannelType.PrivateThread) {
            return interaction.editReply({ content: 'Este comando só pode ser usado dentro de um tópico (thread).' });
        }

        const currentThread = interaction.channel;
        const oldTitle = currentThread.name;

        let cleanedTitle = oldTitle;
        if (oldTitle.startsWith("🔵 ") || oldTitle.startsWith("🟢 ")) {
            cleanedTitle = oldTitle.substring(2).trim();
        } else if (oldTitle.startsWith("🟡 [")) {
            const match = oldTitle.match(/^🟡 \[.*?\] - (.*)/);
            if (match && match[1]) {
                cleanedTitle = match[1].trim();
            }
        }
        
        const prefixLength = `🟡 [${iniciais}] - `.length; 
        const maxCleanedTitleLength = 100 - prefixLength;
        const finalCleanedTitle = cleanedTitle.length > maxCleanedTitleLength ?
                                   cleanedTitle.substring(0, maxCleanedTitleLength).trim() :
                                   cleanedTitle;

        const newTitle = `🟡 [${iniciais}] - ${finalCleanedTitle}`;

        try {
            await interaction.editReply({ content: `⏳ Atribuindo tópico a ${iniciais}...` });
            await currentThread.setName(newTitle, `Tópico atribuído a ${iniciais} por ${interaction.user.tag}`);
            // Removido 'ephemeral: false' para mensagens públicas.
            await interaction.editReply({ content: `Tópico atribuído a **${iniciais}**. Novo título: \`${newTitle}\`` });
        } catch (error) {
            console.error('Erro ao renomear tópico:', error);
            if (error.code === 50013) {
                await interaction.editReply({ content: 'Não tenho permissão para renomear este tópico. Verifique as permissões do bot.' });
            } else {
                await interaction.editReply({ content: `Ocorreu um erro ao renomear o tópico: ${error.message}` });
            }
        }
    },
};