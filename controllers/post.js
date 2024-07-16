const { BadRequest } = require('http-errors');
const { ErrorMessages } = require('../constants/index');

const {
  Post, User, Tag, PostTag,
} = require('../models/index');

// получить посты с фильтрами
async function getPostList({
  tag, limit, offset, typeOfSort, userId,
}) {
  if (userId) {
    return Post.findAll({
      where: { userId },
      include: [{
        model: Tag,
        through: {
          model: PostTag,
          attributes: [],
        },
      }],
      order: [['createdAt', typeOfSort]],
      limit,
      offset,
    });
  }
  if (tag) {
    const tagAndPosts = await Tag.findOne({
      where: { value: tag },
      include: [{
        model: Post,
        through: {
          model: PostTag,
          attributes: [],
        },
      }],
    });
    return tagAndPosts;
  }

  const postsAndTags = await Post.findAll({
    include: [{
      model: Tag,
      through: {
        model: PostTag,
        attributes: [],
      },
    }],
    order: [['createdAt', typeOfSort]],
    limit,
    offset,
  });
    // return postTag.map((p) => p.get());
  return postsAndTags;
}

// получить конкретный пост пользователя
async function getPost({ id: userId }, { postId }) {
  const post = await Post.findOne({
    where: {
      id: postId,
      userId,
    },
    attributes: {
      exclude: ['id', 'userId', 'isPublished'],
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['firstName', 'id'],
    }],
  });
  return post.get();
}

// создать пост
async function createPost({ id: userId }, { text, tags }) {
  const tagResult = await Promise.all(tags.map((value) => Tag.findOrCreate({ where: { value } })));
  const tag = tagResult.map((result) => result[0]);

  const post = await Post.create({
    userId,
    text,
  });

  await PostTag.create({ postId: post.id, tagId: tag[0].id });

  return { post, tag };
}

// изменить пост
async function updatePost({ id: userId }, { postId }, {
  text,
}) {
  const post = await Post.findOne({
    where: {
      id: postId,
      userId,
    },
    attributes: [
      'id',
      'text',
    ],
  });

  if (!post) throw new BadRequest(ErrorMessages.missing_required_field);

  post.set({
    text,
  });
  await post.save();
  return post.get();
}

// удалить конкретный пост пользователя
async function deletePost({ id }, { postId }) {
  await Post.destroy({
    where: {
      id: postId,
      userId: id,
    },
  });
}

module.exports = {
  getPostList,
  createPost,
  getPost,
  updatePost,
  deletePost,
};
