// app/page.tsx

"use client";

// app/page.tsx

import { useState } from 'react';
import Link from 'next/link';

const Home = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<{ id: number, title: string, content: string }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost = { id: Date.now(), title, content };
    setPosts([...posts, newPost]);
    setTitle('');
    setContent('');
  };

  return (
    <div>
      <h1>Create a New Post</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <button type="submit">Post</button>
      </form>
      <h2>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>
              <a>{post.title}</a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
