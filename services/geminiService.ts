import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBGzaH_b8nihf-U-aqwfkh_OJwx8DgiiDk"; 
const genAI = new GoogleGenerativeAI(API_KEY);

export const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});
