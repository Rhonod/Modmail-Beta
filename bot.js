// Temporary store for modmail threads (in-memory, for demo purposes)
// Modmail threads will be associated with user IDs
const activeModmailThreads = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Handle DM to create a modmail thread
    if (message.channel.type === ChannelType.DM && !message.author.bot) {
        // Check if user already has an active modmail thread
        if (activeModmailThreads.has(message.author.id)) {
            // Notify the user they already have an open ticket
            return message.author.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Active Ticket Found')
                        .setDescription('You already have an open ticket. Please wait for a moderator to respond or close the current ticket before opening a new one.')
                        .setTimestamp()
                ]
            });
        }

        const modChannel = await client.channels.fetch(MOD_CHANNEL_ID);
        if (modChannel) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('New Modmail')
                .setDescription(`**From:** ${message.author.tag}\n**Message:** ${message.content}`)
                .setTimestamp();

            const modMessage = await modChannel.send({ embeds: [embed] });
            modMessage.react('✉️'); // Add a reaction for moderators to reply

            // Save the modmail thread information (using in-memory storage for this example)
            activeModmailThreads.set(message.author.id, {
                userId: message.author.id,
                modMessageId: modMessage.id
            });

            // Respond to the user in DM
            message.author.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('Modmail Received')
                        .setDescription('Thank you for reaching out! Our moderators will get back to you soon.')
                        .setTimestamp()
                ]
            });
        }
    }
});

// Command to close a ticket
client.on('messageCreate', async (message) => {
    if (message.content.startsWith(`${PREFIX}close`)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const userId = args[0].replace(/[^0-9]/g, ''); // Extract user ID from args

        if (!userId) return message.channel.send('Please provide a valid user ID.');

        if (activeModmailThreads.has(userId)) {
            const user = await client.users.fetch(userId);
            const dmChannel = await user.createDM();

            // Send notification to the user that the ticket has been closed
            dmChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Modmail Closed')
                        .setDescription('Your support ticket has been closed. If you need further assistance, please reach out again.')
                        .setTimestamp()
                ]
            });

            // Remove the thread from active modmail
            activeModmailThreads.delete(userId);

            // Notify the mod channel that the ticket was closed
            message.channel.send('Modmail thread closed and user notified.');
        } else {
            message.channel.send('No active ticket found for that user.');
        }
    }
});
