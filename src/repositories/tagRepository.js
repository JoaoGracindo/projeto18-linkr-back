import connection from "../database/database.js";

export function repoTrending(){
    return connection.query(`
        SELECT tags.name AS name, count("tags_pivot".tag_id)
        FROM "tags_pivot"
        JOIN tags
        ON "tags_pivot".tag_id = tags.id
        GROUP BY tags.name
        ORDER BY count("tags_pivot".tag_id) desc
    `)
} 

export function repoPostTag(tags){
    return connection.query(`
        INSERT INTO tags ()
    `)
}

export async function repoTagExist(tags) {
    let arr = []
    for (let i = 0; i < tags.length; i++) {
        const result = await connection.query(`
            SELECT tags.name
            FROM tags
            WHERE tags.name = $1;
        `, [tags[i]])
        arr.push(result.rowCount > 0 ? true : false)
    }
    return arr
  }

export async function repoTagId(tags) {
let arr = []
for (let i = 0; i < tags.length; i++) {
    const {rows: [{id: id}]} = await connection.query(`
        SELECT tags.id AS id
        FROM tags
        WHERE tags.name = $1;
    `, [tags[i]])
    arr.push(id)
}
return arr
}

export function createTag(tag) {
    return connection.query(`
        INSERT INTO tags (name)
        VALUES ($1)
    `, [tag])
}

export async function insertTag(tag, post_id) {
    const {rows: [{tag_id}]} = await connection.query(`
        SELECT id AS tag_id
        FROM tags
        WHERE tags.name = $1
        LIMIT 1
    `, [tag])

    return connection.query(`
        INSERT INTO "tags_pivot" (post_id, tag_id)
        VALUES ($1, $2)
`, [post_id, tag_id])
}

export async function repoDeletePostTags(post_id){
    await connection.query(`
        DELETE FROM 
        "tags_pivot"
        WHERE "tags_pivot".post_id = $1
    `, [post_id])
}