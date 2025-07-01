const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reabrir_topico')
        .setDescription('Reabre tópico (🟢->🔵 ou 🟡). Mantém iniciais se houver. Max 100 chars.'), // <--- DESCRIÇÃO ENCURTADA AQUI!
    async execute(interaction) {
        // Início do "loading": Adia a resposta
        await interaction.deferReply({ flags: 64 }); // 64 = ephemeral

        // Verifica se o comando está sendo usado dentro de um tópico (thread)
        if (interaction.channel.type !== ChannelType.PublicThread && interaction.channel.type !== ChannelType.PrivateThread) {
            return interaction.editReply({ content: 'Este comando só pode ser usado dentro de um tópico (thread).' });
        }

        const currentThread = interaction.channel;
        const oldTitle = currentThread.name;
        let newTitle = "";
        let baseTitle = oldTitle; // Título sem qualquer prefixo de emoji/iniciais

        // **NOVA LÓGICA: SÓ REABRE SE ESTIVER FECHADO (🟢)**
        if (oldTitle.startsWith("🟢 ")) {
            baseTitle = oldTitle.substring(2).trim(); // Remove "🟢 "
            
            // Tenta ver se o título original (antes do 🟢) tinha iniciais (🟡 [IN] -)
            const yellowMatch = baseTitle.match(/^\[.*?\] - (.*)/); // Procura [IN] - no título base
            if (yellowMatch && yellowMatch[1]) {
                // Se tinha iniciais, reabre com amarelo e as iniciais
                const initialsPart = baseTitle.match(/^\[.*?\]/)[0]; // Pega a parte [IN]
                baseTitle = yellowMatch[1].trim(); // Pega o resto do título
                newTitle = `🟡 ${initialsPart} - ${baseTitle}`;
            } else {
                // Se não tinha iniciais, reabre com azul
                newTitle = `🔵 ${baseTitle}`;
            }
        } else {
            // Se o tópico não começar com 🟢, significa que não está "fechado" no nosso contexto.
            // Avisa o usuário e não faz nada.
            return interaction.editReply({ content: 'Este tópico não parece estar fechado (não começa com 🟢) ou já está aberto/atribuído.' });
        }
        
        try {
            await interaction.editReply({ content: '⏳ Reabrindo o tópico...' });
            await currentThread.setName(newTitle, `Tópico reaberto por ${interaction.user.tag}`);
            await interaction.editReply({ content: `Tópico reaberto! Novo título: \`${newTitle}\`` });
        } catch (error) {
            console.error('Erro ao reabrir tópico:', error);
            if (error.code === 50013) { // Missing Permissions
                await interaction.editReply({ content: 'Não tenho permissão para renomear este tópico. Verifique as permissões do bot.' });
            } else {
                await interaction.editReply({ content: `Ocorreu um erro ao reabrir o tópico: ${error.message}` });
            }
        }
    },
};