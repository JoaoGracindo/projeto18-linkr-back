import db from "../database/database.js";

export async function insertPostRepository(userId, link, description) {
  return await db.query(
    `
        INSERT INTO posts
        (owner, link, description)
        VALUES ($1, $2, $3);    
    `,
    [userId, link, description]
  );
}

export async function getTimelineRepository() {
  return await db.query(`
  SELECT p.owner, p.link, p.description, p.id, users.pic_url, users.name
  FROM posts p
  JOIN users
  ON users.id = p.owner
  WHERE p.deleted = false
  GROUP BY p.id, users.pic_url, users.name
  ORDER BY p.created_at DESC
  LIMIT 20;
    `);
}

export async function getPostOwnerRepository(postId) {
  return await db.query(
    `
        SELECT owner
        FROM posts
        WHERE id=$1;
    `,
    [postId]
  );
}

export async function putLinkRepository(newDescription, postId) {
  return await db.query(
    `
        UPDATE posts
        SET description=$1
        WHERE id=$2;
    `,
    [newDescription, postId]
  );
}

export async function deleteLinkRepository(postId) {
  return await db.query(
    `
        UPDATE posts
        SET deleted=TRUE
        WHERE id=$1;
    `,
    [postId]
  );
}

export async function getPostByHashtagRepository(hashtag) {
  return await db.query(
    `
      SELECT p.owner, p.link, p.description, p.id, users.pic_url, users.name
      FROM posts p
      JOIN users
      ON users.id = p.owner
      JOIN tags_pivot pt
      ON pt.post_id = p.id
      JOIN tags
      ON tags.id = pt.tag_id
      WHERE p.deleted = false AND tags.name = $1
      GROUP BY p.id, users.pic_url, users.name
      ORDER BY p.created_at DESC
      LIMIT 20;
    `,
    [hashtag]
  );
}