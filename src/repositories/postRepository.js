import db from "../database/database.js";

export async function insertPostRepository(userId, link, description) {
  return await db.query(
    `
        INSERT INTO posts
        (owner, link, description)
        VALUES ($1, $2, $3)
        RETURNING id;    
    `,
    [userId, link, description]
  );
}

export async function getTimelineRepository(refresh_type, timestamp, user_id) {
  let time_filter = ""
  let follow_filter = "";
  if(refresh_type === "bottom") time_filter = `AND p.created_at < ${timestamp}` 
  if(refresh_type === "top")  time_filter = `AND p.created_at > ${timestamp}` 
  if(user_id) follow_filter = `AND f.follower = ${user_id}`;
  return await db.query(`

  SELECT p.owner, p.link, p.description, p.id, p.reposted_by, p.origin_post_id, users.pic_url, users.name,
    repost_user.name AS reposted_by_name,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS "commentsCount",
    (SELECT 
      CASE
        WHEN p.origin_post_id IS NOT NULL
          THEN (SELECT COUNT(*) FROM reposts WHERE post_id = p.origin_post_id) 
        ELSE (SELECT COUNT(*) FROM posts WHERE origin_post_id = p.id)
      END
    AS repost_count) AS repost_count
    FROM posts p
    JOIN users ON users.id = p.owner
    JOIN follows f ON (f.user_id=p.owner OR f.follower_id = p.owner)
    LEFT JOIN users AS repost_user ON repost_user.id = p.reposted_by
    WHERE p.deleted = false ${time_filter}
    AND (p.owner = $1 OR f.follower_id = $1)
    GROUP BY p.id, users.pic_url, users.name, repost_user.name
    ORDER BY p.created_at DESC
    LIMIT 10;
    `, [user_id]);
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

export async function getPostByHashtagRepository(hashtag, refresh_type, timestamp) {
  let bind = [hashtag]
  let time_filter = ""
  if(refresh_type) bind.push(timestamp)
  if(refresh_type === "bottom") time_filter = `AND p.created_at < $2` 
  if(refresh_type === "top")  time_filter = `AND p.created_at > $2` 

  return await db.query(
    `
      SELECT p.owner, p.link, p.description, p.id, users.pic_url, p.created_at, users.name
      FROM posts p
      JOIN users
      ON users.id = p.owner
      JOIN "tags_pivot" pt
      ON pt.post_id = p.id
      JOIN tags
      ON tags.id = pt.tag_id
      WHERE p.deleted = false AND tags.name = $1 ${time_filter}
      GROUP BY p.id, users.pic_url, users.name
      ORDER BY p.created_at DESC
      LIMIT 10;
    `,
    bind
  );
}

export async function userLikedRepository(user_id, post_id){
  return await db.query(
    `
      SELECT likes.id as liked
      FROM likes
      WHERE likes.user_id = $1 AND likes.post_id = $2
    `, [user_id, post_id]
  )
}

export async function repostLinkRepository(user_id,post_id){
  return await db.query(
    `
    INSERT INTO reposts
    (user_id,post_id)
    VALUES
    ($1,$2)
    
    `,[user_id,post_id]
  )
}

export async function getReposts(){
  return await db.query(
    `
    SELECT p.owner, p.link, p.description, p.id, users.pic_url
    FROM posts p
    JOIN users
    ON users.id = p.owner
    JOIN reposts
    ON posts.id = resposts.post_id
    WHERE p.deleted = false
    GROUP BY p.id, users.pic_url, users.name
    ORDER BY p.created_at DESC
    LIMIT 20;
    `
  )
}

export async function repostInPosts(user_id,post_id){

  try {
    
    const {rows:post} = await db.query(`SELECT * FROM posts WHERE id = $1`,[post_id])
    
    const {owner,link,description} =  post[0]

    return await db.query(
      `
      INSERT INTO posts
      (owner,link,description,reposted_by,origin_post_id)
      VALUES
      ($1,$2,$3,$4,$5)
      `,[owner,link,description,user_id,post_id]
    )

  } catch (error) {
    console.log(error)
  }
}

