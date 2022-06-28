// import user and thought models
const { User, Thought } = require('../models');
// import built in authetification from apollo and auth function from utils dir
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

// functions that trigger when queries/mutation reqs are sent
const resolvers = {
  Query: {
    // GET current user
    me: async (parent, args, context) => {
      //if user is logged in
      if (context.user) {
        // find user where _id = current user _id
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('thoughts')
          .populate('friends');
        // return that data
        return userData;
      }
      // otherwise throw error
      throw new AuthenticationError('Not logged in');
    },

    // GET all users
    users: async () => {
      return User.find()
      .select('-__v -password')
      .populate('thoughts')
      .populate('friends');
    },

    // GET single user by username
    user: async (parent, { username }) => {
      return User.findOne({ username })
      .select('-__v -password')
      .populate('friends')
      .populate('thoughts');
    },

    // if username is present, GET all their thoughts, if not GET all thoughts
    thoughts: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Thought.find(params).sort({ createdAt: -1 });
    },

    // GET single thought by _id
    thought: async (parent, { _id }) => {
      return Thought.findOne({ _id });
    }
  },

  Mutation: {
    // POST new user to db
    addUser: async (parent, args) => {
      // create new user (and jwt token) with mutation params
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },

    // PUT/update logged-in status
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
    
      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }
    
      const correctPw = await user.isCorrectPassword(password);
    
      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }
    
      const token = signToken(user);
      return { token, user };
    },

    addThought: async (parent, args, context) => {
      if (context.user) {
        const thought = await Thought.create({ ...args, username: context.user.username });
    
        await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { thoughts: thought._id } },
          { new: true }
        );
    
        return thought;
      }
    
      throw new AuthenticationError('You need to be logged in!');
    },

    addReaction: async (parent, { thoughtId, reactionBody }, context) => {
      if (context.user) {
        const updatedThought = await Thought.findOneAndUpdate(
          { _id: thoughtId },
          { $push: { reactions: { reactionBody, username: context.user.username } } },
          { new: true, runValidators: true }
        );
    
        return updatedThought;
      }
    
      throw new AuthenticationError('You need to be logged in!');
    },
    
    addFriend: async (parent, { friendId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { friends: friendId } },
          { new: true }
        ).populate('friends');
    
        return updatedUser;
      }
    
      throw new AuthenticationError('You need to be logged in!');
    }
  }
};

module.exports = resolvers;
