import mongoose from "mongoose";
// mongoose.connect(
//   `mongodb+srv://palacios:Snitch21!@cluster0.emz01hg.mongodb.net/palacios?retryWrites=true&w=majority&appName=Cluster0`
// );
mongoose.connect(
  `mongodb+srv://palacios:Snitch21!@cluster0.emz01hg.mongodb.net/palacios_clean?retryWrites=true&w=majority&appName=Cluster0`,
);
console.log("Mongo DB Connection Successful ");

export default mongoose;
