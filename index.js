const path = require("path")
const fs = require("fs")
const { parse } = require("csv-parse")
const messagesFolder = fs.readdirSync(path.join(__dirname, 'package', 'messages'))
const { MeiliSearch } = require('meilisearch')
const search = new MeiliSearch({
    host: 'http://localhost:7700',
})

messagesFolder.forEach((f) => {
    if (f != "index.json") {
        const folderPath = path.join(__dirname, 'package', 'messages', f)
        const channelFile = require(folderPath + "/channel.json")
        let data = []
        parse(fs.readFileSync(folderPath + "/messages.csv", "utf-8"), {
            delimiter: ",",
            columns: ['id', 'timestamp', 'content'],
            record_delimiter: "\n",
            relax_column_count: true
        }, async (err, rec) => {
            if(!err) {
                try {
                    rec.shift()
                    if (channelFile.type == 0 || channelFile.type == 11) {
                        rec.forEach((r) => {
                            data.push({
                                guild: `[${channelFile.type}] ${channelFile.guild?.name} (${channelFile.guild?.id})`,
                                channel: `${channelFile.name} (${channelFile.id})`,
                                message_id: r.id,
                                message_time: r.timestamp,
                                message_content: r.content,
                            })
                        })
                    }
                    else {
                        rec.forEach((r) => {
                            data.push({
                                recipients: `${channelFile.recipients?.[0]} & ${channelFile.recipients?.[1]}`,
                                message_id: r.id,
                                message_time: r.timestamp,
                                message_content: r.content,
                            })
                        })
                    }
                    const s = await search.index('messages').addDocuments(data)
                    console.log(s)
                }
                catch(e) {
                    console.error(e)
                }
            }
            else {
                console.log("[ERROR] Parsing Error (CSV)")
            }
        })
    }
})