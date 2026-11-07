import type { QuizQuestion } from "@/lib/types";

export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: "ict_1",
    domain: "ICT Support",
    prompt: "A user cannot connect to the office Wi-Fi after a password change. What should you check first?",
    options: [
      "Reinstall Windows",
      "Forget the network and reconnect with the new password",
      "Replace the laptop motherboard",
      "Disable the firewall permanently",
    ],
    answerIndex: 1,
    explanation: "Start with the simplest configuration issue: refresh Wi-Fi credentials.",
  },
  {
    id: "ict_2",
    domain: "ICT Support",
    prompt: "Which tool is most appropriate for checking basic network reachability?",
    options: ["ping", "Excel", "Photoshop", "Notion"],
    answerIndex: 0,
    explanation: "ping tests whether a host responds on the network.",
  },
  {
    id: "net_1",
    domain: "Networking",
    prompt: "What does TCP provide that UDP does not?",
    options: [
      "Faster delivery always",
      "Connection-oriented reliable delivery",
      "No headers",
      "Automatic Wi-Fi passwords",
    ],
    answerIndex: 1,
    explanation: "TCP establishes a connection and provides reliability features.",
  },
  {
    id: "sec_1",
    domain: "Cybersecurity",
    prompt: "An unexpected email asks you to click a link and enter your payroll password. This is likely:",
    options: ["A green flag", "Phishing", "A hardware failure", "DNS propagation"],
    answerIndex: 1,
    explanation: "Credential-harvesting emails are a classic phishing pattern.",
  },
  {
    id: "dev_1",
    domain: "Software Development",
    prompt: "What does a 404 HTTP status usually mean?",
    options: [
      "Server is offline",
      "Resource not found",
      "Unauthorized",
      "Request timeout",
    ],
    answerIndex: 1,
    explanation: "404 means the requested resource could not be found.",
  },
  {
    id: "hr_1",
    domain: "Human Resources",
    prompt: "A recruiter asks a candidate to pay a medical fee before interviewing. What should HR advise?",
    options: [
      "Pay immediately to secure the role",
      "Treat it as a red flag and verify through official channels",
      "Ignore all job opportunities",
      "Send money via personal M-Pesa only",
    ],
    answerIndex: 1,
    explanation: "Legitimate employers do not require candidates to pay interview fees.",
  },
];

export function pickQuiz(domain?: string, count = 3): QuizQuestion[] {
  const pool = domain
    ? QUIZ_BANK.filter((q) => q.domain.toLowerCase() === domain.toLowerCase())
    : QUIZ_BANK;
  const source = pool.length >= count ? pool : QUIZ_BANK;
  return [...source].sort(() => Math.random() - 0.5).slice(0, count);
}
