import bcrypt from 'bcryptjs'
import { pgPool } from '../src/config/pgDb.js'

async function seedData() {
  const client = await pgPool.connect()
  try {
    console.log('🌱 Starting PostgreSQL Data Seed for 3 Users...')

    await client.query('BEGIN')

    // 1. Clean existing tables
    await client.query('TRUNCATE comments, likes, story_views, stories, posts, follows, users CASCADE;')

    // Hashed default password ("password123")
    const hashedPassword = await bcrypt.hash('password123', 10)

    // 2. Insert 3 Users
    const user1Res = await client.query(
      `INSERT INTO users (username, email, password_hash, bio, profile_pic_url, account_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username`,
      [
        '2500080160',
        '2500080160@kluniversity.in',
        hashedPassword,
        'Full-Stack Developer & AI Systems Engineer 🚀',
        'https://avatars.githubusercontent.com/u/228768333?v=4',
        'creator'
      ]
    )

    const user2Res = await client.query(
      `INSERT INTO users (username, email, password_hash, bio, profile_pic_url, account_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username`,
      [
        'maripilakshmivenkat',
        'maripilakshmivenkat@gmail.com',
        hashedPassword,
        'Building DevGram & Cloud Infrastructure ⚡',
        'https://lh3.googleusercontent.com/a/ACg8ocIECeKzuW9Xe2s-EwQ1NVwCsJHisDVhggfY8pIEXuKcRlfb9foN=s96-c',
        'professional'
      ]
    )

    const user3Res = await client.query(
      `INSERT INTO users (username, email, password_hash, bio, profile_pic_url, account_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username`,
      [
        'sarah_dev',
        'sarah.chen@devgram.io',
        hashedPassword,
        'React & TypeScript Advocate | Open Source Contributor 🎨',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        'creator'
      ]
    )

    const u1 = user1Res.rows[0].id
    const u2 = user2Res.rows[0].id
    const u3 = user3Res.rows[0].id

    console.log('✅ 3 Users inserted successfully!')

    // 3. Insert Follows (Composite Primary Keys)
    await client.query(`
      INSERT INTO follows (follower_id, following_id) VALUES
      ('${u1}', '${u2}'),
      ('${u1}', '${u3}'),
      ('${u2}', '${u1}'),
      ('${u3}', '${u1}');
    `)
    console.log('✅ Follow relationships inserted!')

    // 4. Insert Posts
    const post1Res = await client.query(
      `INSERT INTO posts (user_id, caption, media_url, media_type)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        u1,
        'Shipped the new DevGram Stories & PostgreSQL Data Engine! 🚀🔥 #build #react #node #postgres',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        'code_snippet'
      ]
    )

    const post2Res = await client.query(
      `INSERT INTO posts (user_id, caption, media_url, media_type)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        u2,
        'Configured cloud database schema with foreign key integrity and composite indexes! ⚡',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        'image'
      ]
    )

    const p1 = post1Res.rows[0].id
    const p2 = post2Res.rows[0].id

    console.log('✅ Posts inserted!')

    // 5. Insert Stories (matching user schema: id, user_id, media_url, media_type, created_at, expires_at)
    const story1Res = await client.query(
      `INSERT INTO stories (user_id, media_url, media_type)
       VALUES ($1, $2, $3) RETURNING id`,
      [
        u1,
        'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80',
        'image'
      ]
    )

    const story2Res = await client.query(
      `INSERT INTO stories (user_id, media_url, media_type)
       VALUES ($1, $2, $3) RETURNING id`,
      [
        u2,
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        'code_canvas'
      ]
    )

    const s1 = story1Res.rows[0].id
    const s2 = story2Res.rows[0].id

    console.log('✅ Stories inserted!')

    // 6. Insert Story Views (Composite Primary Keys)
    await client.query(`
      INSERT INTO story_views (story_id, viewer_id) VALUES
      ('${s1}', '${u2}'),
      ('${s1}', '${u3}'),
      ('${s2}', '${u1}');
    `)
    console.log('✅ Story views inserted!')

    // 7. Insert Likes (Polymorphic FK check: post_id or story_id)
    await client.query(`
      INSERT INTO likes (user_id, post_id) VALUES
      ('${u2}', '${p1}'),
      ('${u3}', '${p1}'),
      ('${u1}', '${p2}');
    `)

    await client.query(`
      INSERT INTO likes (user_id, story_id) VALUES
      ('${u2}', '${s1}'),
      ('${u1}', '${s2}');
    `)
    console.log('✅ Likes inserted!')

    // 8. Insert Threaded Comments
    const comment1Res = await client.query(
      `INSERT INTO comments (post_id, user_id, text)
       VALUES ($1, $2, $3) RETURNING id`,
      [p1, u2, 'Incredible work on the PostgreSQL schema setup! 👏']
    )

    const c1 = comment1Res.rows[0].id

    await client.query(
      `INSERT INTO comments (post_id, user_id, parent_comment_id, text)
       VALUES ($1, $2, $3, $4)`,
      [p1, u1, c1, 'Thanks Lakshmi! The relational schema design runs super fast! ⚡']
    )

    console.log('✅ Comments inserted!')

    await client.query('COMMIT')
    console.log('🎉 PostgreSQL Database successfully populated with 3 Users and complete relational data!')

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Seed error:', err)
  } finally {
    client.release()
    process.exit(0)
  }
}

seedData()
