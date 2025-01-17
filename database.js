const { createClient } = supabase;
const _supabase = createClient(
  "https://qyqfjvyqxydsvwjeqzrd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWZqdnlxeHlkc3Z3amVxenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMDY5NzEsImV4cCI6MjA1MjY4Mjk3MX0.JIyc6UX1xm4xiolNgHKCx3gOfQut3dazB_rYti8SOuo"
);

export async function fetchQuestions() {
  const { data, error } = await _supabase.from("Question").select("*");

  if (error) {
    console.error("Error fetching questions:", error);
  } else {
    console.log("Questions:", data);
  }
}

export function createUser(username, password) {
  return _supabase
    .from("User")
    .select("*")
    .eq("username", username)
    .single()
    .then(({ data: existingUser, error }) => {
      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (existingUser) {
        return { message: "User already exists", status: "exists" };
      }

      // If no user found, create a new one
      return _supabase
        .from("User")
        .insert([
          {
            username: username,
            password: password,
            isAdmin: false,
          },
        ])
        .single()
        .then(({ data: newUser, error: insertError }) => {
          if (insertError) {
            throw insertError;
          }
          return { message: "User created", status: "success" };
        });
    })
    .catch((error) => {
      console.error("Error finding or creating user:", error);
      throw error;
    });
}

export function findUser(username, password) {
  return _supabase
    .from("User")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single()
    .then(({ data: existingUser, error }) => {
      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (existingUser) {
        return { user: existingUser, status: "exists" };
      }

      return { user: null, status: "no-user" };
    })
    .catch((error) => {
      console.error("Error finding user:", error);
      throw error;
    });
}

export function getRandomUnsolvedQuestion(username) {
  // Query to get a random question that the user hasn't solved
  return _supabase
    .rpc("get_random_unsolved_question", { username })
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }

      // Check if data is null or an empty array
      if (!data || data.length === 0) {
        return []; // Return an empty list
      }

      return data; // Return the random unsolved question(s)
    })
    .catch((error) => {
      console.error("Error getting random unsolved question:", error);
      return null; // Return null in case of an error
    });
}

export async function insertSolveData(qid, username, isCorrect, time) {
  try {
    // Inserting the data into the Solve table
    await _supabase.from("Solve").insert([
      {
        qid: qid,
        username: username,
        correct: isCorrect,
        time: time,
      },
    ]);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

export async function getLeaderboard() {
  // Fetch data from the Solve table in Supabase
  const { data, error } = await _supabase
    .from("Solve")
    .select("username, correct, time")
    .order("username", { ascending: true }); // Sort by username, we will group by it later

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    return;
  }

  // Create a map to store the leaderboard data
  const leaderboard = {};

  // Aggregate the results for each user
  data.forEach((row) => {
    // Initialize if user is not yet in the leaderboard map
    if (!leaderboard[row.username]) {
      leaderboard[row.username] = {
        totalCorrect: 0,
        totalTime: 0,
      };
    }

    // Add the correct answers count (1 for correct, 0 for incorrect)
    if (row.correct) {
      leaderboard[row.username].totalCorrect += 1;
    }

    // Add the time spent on each question
    leaderboard[row.username].totalTime += new Date(row.time).getTime(); // Ensure `time` is converted to a timestamp
  });

  const sortedLeaderboard = Object.entries(leaderboard)
    .map(([username, { totalCorrect, totalTime }]) => ({
      username,
      totalCorrect,
      totalTime,
    }))
    .sort((a, b) => {
      // First, sort by totalCorrect in descending order
      if (b.totalCorrect !== a.totalCorrect) {
        return b.totalCorrect - a.totalCorrect;
      }
      // If correct answers are the same, sort by totalTime in ascending order
      return a.totalTime - b.totalTime;
    });

  return sortedLeaderboard;
}

export async function getQuestions() {
  // Fetch data from the Solve table in Supabase
  const { data, error } = await _supabase
    .from("Question")
    .select("qid, question, answer");

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    return;
  }

  return data;
}

export async function removeQuestion(qid) {
  const { data, error } = await _supabase
    .from("Question")
    .delete()
    .eq("qid", qid); // Match the qid column with the provided qid value

  if (error) {
    console.error("Error deleting question:", error);
    return;
  }
}

export async function getTotalQuestion() {
  const { count, error } = await _supabase
    .from("Question")
    .select("qid", { count: "exact" }); // Fetch only the count of qid

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    return;
  }

  return count;
}

export async function insertQuestion(question, answer) {
  try {
    // Get the current max qid
    const maxQid = await getMaxQid();

    // If max qid is found, increment it to get the new qid
    const newQid = maxQid + 1;

    // Inserting the data into the Question table
    const { data, error } = await _supabase.from("Question").insert([
      {
        qid: newQid, // Use the new qid
        question: question,
        answer: answer,
      },
    ]);

    if (error) {
      console.error("Error inserting question:", error);
      return;
    }

    console.log("Question inserted successfully:", data);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

async function getMaxQid() {
  const { data, error } = await _supabase
    .from("Question")
    .select("qid")
    .order("qid", { ascending: false }) // Order by qid in descending order
    .limit(1); // Get only the first result

  if (error) {
    console.error("Error fetching max qid:", error);
    return;
  }

  // Check if data exists and return the maximum qid, or return 0 if no data
  return data && data.length > 0 ? data[0].qid : 0;
}

export async function updateQuestion(qid, question, answer) {
  try {
    // Updating the data in the Question table where qid matches the provided qid
    const { data, error } = await _supabase
      .from("Question")
      .update({ question: question, answer: answer }) // Update fields
      .eq("qid", qid); // Match the row where qid = provided qid

    if (error) {
      console.error("Error updating question:", error);
      return;
    }

    console.log("Question updated successfully:", data);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}
