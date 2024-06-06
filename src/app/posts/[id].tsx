// app/posts/[id].tsx

"use client";

import { useRouter } from "next/router";
import { useState, useEffect } from "react";

const Post = () => {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<{
    id: number;
    title: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      const storedPosts = JSON.parse(localStorage.getItem("posts") || "[]");
      const foundPost = storedPosts.find(
        (post: { id: number }) => post.id === Number(id)
      );
      setPost(foundPost);
    }
  }, [id]);

  if (!post) return <p>Loading...</p>;

  return (
    <div className="p-4 bg-gray-800 rounded">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
};

export default Post;
