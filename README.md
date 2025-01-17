# GeogameTrivia

**Developer:** Feyzi Özgür Orhon  
**Student ID:** 21833336

## Introduction

The Text-Based Question Answer Game is a fun and engaging quiz game with two types of users: **Admin** and **Player**. Players can answer random questions and track their progress, while Admins manage the database of questions through CRUD (Create, Read, Update, Delete) operations. This game is powered by **Supabase**, a PostgreSQL-based open-source database platform, and operates on the client side without a backend server.

## Features

### Admin Features

Admins have full control over the question database:

- **Add Questions**: Admins can add new questions and corresponding answers to the database.
- **Edit Questions or Answers**: Admins can update existing questions or answers.
- **Delete Questions**: Admins can remove unwanted or incorrect questions.
- **View All Questions**: Admins can view a complete list of all questions in the database.

### Player Features

Players interact with the game by answering questions:

- **Answer Questions**: Players are presented with random unanswered questions from the database.
- **Feedback**: Players receive immediate feedback on whether their answer is correct or incorrect.
- **Game Completion**: The game ends when all questions have been answered.
- **Leaderboard**: Players can view their ranking based on:
  - The number of correct answers.
  - The total time taken to answer questions (for players with equal correct answers).

## Technical Details

### Database

The application uses **Supabase** as the database platform, which is PostgreSQL-based and open-source.

#### Tables:

- **user** Table: Stores player credentials, including username, password, and role (admin or player).
- **question** Table: Contains questions, their corresponding answers, and unique IDs.
- **solve** Table: Tracks unanswered questions for each user and is used for leaderboard ranking.

### Security Notes

Since the game operates without a backend server, it lacks authentication for the tables, and the API key is exposed. Although the user interface is designed with security in mind, this setup leaves the program vulnerable to SQL injection attacks.

### Event Handlers

Event listeners manage dynamic functionality within the game:

- Admin CRUD actions (add, edit, delete).
- Player question navigation and answer submission.
