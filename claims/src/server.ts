import express from "express";

const app = express();
const PORT: number = 4000;

app.use(express.json());

interface UserRequest {
  address: string;
  amount: number;
}

app.post("/claims", (req: any, res: any) => {
  const user: UserRequest = req.body;
  res.status(200).json({
    user,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
