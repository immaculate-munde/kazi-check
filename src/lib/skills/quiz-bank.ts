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
    id: "ict_3",
    domain: "ICT Support",
    prompt: "A printer shows offline but is powered on. What is a sensible first step?",
    options: [
      "Buy a new printer immediately",
      "Check cable or Wi-Fi connection and reprint a test page",
      "Format the user PC",
      "Disable antivirus permanently",
    ],
    answerIndex: 1,
    explanation: "Connectivity and queue status are the usual first checks.",
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
    id: "net_2",
    domain: "Networking",
    prompt: "Which device typically forwards packets between different IP networks?",
    options: ["Hub", "Router", "Monitor", "Keyboard"],
    answerIndex: 1,
    explanation: "Routers forward traffic between networks using IP addresses.",
  },
  {
    id: "net_3",
    domain: "Networking",
    prompt: "What is the common purpose of a subnet mask?",
    options: [
      "Encrypt email",
      "Separate network and host portions of an IP address",
      "Charge devices wirelessly",
      "Block all websites",
    ],
    answerIndex: 1,
    explanation: "A subnet mask defines which part of the IP is the network.",
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
    id: "sec_2",
    domain: "Cybersecurity",
    prompt: "Which practice best protects an account if a password leaks?",
    options: [
      "Reusing the same password everywhere",
      "Multi-factor authentication",
      "Sharing the password with friends",
      "Turning off updates",
    ],
    answerIndex: 1,
    explanation: "MFA adds a second factor even when the password is known.",
  },
  {
    id: "sec_3",
    domain: "Cybersecurity",
    prompt: "A USB stick found in the parking lot should usually be treated as:",
    options: [
      "Safe free storage",
      "A potential malware risk",
      "Official IT inventory",
      "A network cable",
    ],
    answerIndex: 1,
    explanation: "Unknown removable media is a common infection vector.",
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
    id: "dev_2",
    domain: "Software Development",
    prompt: "What is the main purpose of version control (for example Git)?",
    options: [
      "Design logos",
      "Track code changes and collaborate safely",
      "Replace the operating system",
      "Increase screen brightness",
    ],
    answerIndex: 1,
    explanation: "Version control records history and supports team collaboration.",
  },
  {
    id: "dev_3",
    domain: "Software Development",
    prompt: "A failing automated test after your change usually means you should:",
    options: [
      "Ignore it and deploy",
      "Investigate and fix before merging",
      "Delete the test framework",
      "Disable the CI server permanently",
    ],
    answerIndex: 1,
    explanation: "Failing tests are a signal to investigate before shipping.",
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
  {
    id: "hr_2",
    domain: "Human Resources",
    prompt: "Where should official job applications for a large employer usually go?",
    options: [
      "A random WhatsApp number",
      "The organisation's official careers portal",
      "A personal Gmail for 'urgent hiring'",
      "Telegram only",
    ],
    answerIndex: 1,
    explanation: "Official portals are the safe default for real hiring processes.",
  },
  {
    id: "hr_3",
    domain: "Human Resources",
    prompt: "Asking candidates for their KRA PIN before any interview is generally:",
    options: [
      "Best practice for every role",
      "Suspicious and should be questioned",
      "Required by all banks",
      "Proof the job is genuine",
    ],
    answerIndex: 1,
    explanation: "Sensitive IDs should not be demanded early without a clear legitimate reason.",
  },
];

export function pickQuiz(domain?: string, count = 3): QuizQuestion[] {
  const pool = domain
    ? QUIZ_BANK.filter((q) => q.domain.toLowerCase() === domain.toLowerCase())
    : QUIZ_BANK;
  const source = pool.length > 0 ? pool : QUIZ_BANK;
  return [...source].sort(() => Math.random() - 0.5).slice(0, Math.min(count, source.length));
}
