import {buildSchema} from "graphql"
export default buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    input UserInputData {
        email: String!
        password: String!
        name: String!
    }
    
    type AuthData {
        userId: String!
        token: String!
    }

    type getPostsData {
        totalPosts: Int!
        posts: [Post!]!
    }

    type StatusData{
        status: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    type RootMutation {
        createUser(inputUser: UserInputData): User!
        createPost(inputPost: PostInputData): Post!
        updatePost(id:ID!, inputPost: PostInputData): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): StatusData!
    }

    type RootQuery {
        login(email:String!,password:String!): AuthData
        getPosts(page: Int!): getPostsData
        getPost(id: ID!): Post
        getUserStatus: StatusData
    }
    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);