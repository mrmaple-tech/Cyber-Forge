/* CyberForge — core reference data: skills, learning path, badges, XP rules. */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});

  CF.XP = { lesson: 50, quiz: 100, lab: 250, challenge: 250, challengeBonus: 100, mission: 100, daily: 150 };

  CF.SKILLS = [
    { id: 'linux', label: 'Linux' },
    { id: 'networking', label: 'Networking' },
    { id: 'kali', label: 'Kali Linux' },
    { id: 'cyber', label: 'Cybersecurity Fundamentals' },
    { id: 'web', label: 'Web Security' },
    { id: 'secops', label: 'Security Operations' },
    { id: 'forensics', label: 'Digital Forensics' }
  ];
  CF.skillLabel = (id) => (CF.SKILLS.find((s) => s.id === id) || { label: id }).label;

  // Course registry. Content files call CF.addCourse({...}).
  CF.COURSES = [];
  CF.addCourse = function (c) { CF.COURSES.push(c); };
  CF.course = (id) => CF.COURSES.find((c) => c.id === id);
  CF.lessonXP = (c) => c.lessons.length * CF.XP.lesson + CF.XP.quiz;

  // Structured learning path (10 levels). `course` links to a registered course.
  CF.PATH = [
    { n: 1, title: 'Linux Fundamentals', course: 'linux', page: 'linux.html', difficulty: 'Beginner', prereq: [], desc: 'Navigate, inspect and manage a Linux system with the 24 essential commands every security professional relies on.' },
    { n: 2, title: 'Terminal & Bash', course: 'bash', page: 'linux.html#bash', difficulty: 'Beginner', prereq: [1], desc: 'Combine commands with pipes and redirection, use variables, and write small, safe automation scripts.' },
    { n: 3, title: 'Networking', course: 'networking', page: 'networking.html', difficulty: 'Beginner', prereq: [1], desc: 'Understand IP addressing, DNS, TCP/UDP, ports, routing, subnets, firewalls and NAT — the language of every security event.' },
    { n: 4, title: 'Kali Linux', course: 'kali', page: 'kali.html', difficulty: 'Beginner', prereq: [1, 2], desc: 'Install, configure and use Kali Linux responsibly, and build an isolated lab for authorized security testing.' },
    { n: 5, title: 'Cybersecurity Fundamentals', course: 'cyber', page: 'cybersecurity.html', difficulty: 'Beginner', prereq: [3], desc: 'The CIA triad, identity and access, cryptography basics, vulnerability and risk management, and incident response.' },
    { n: 6, title: 'Web Security', course: 'web', page: 'web-security.html', difficulty: 'Intermediate', prereq: [3, 5], desc: 'Understand how web applications fail and how to defend them, using simulated vulnerable apps only.' },
    { n: 7, title: 'Security Analysis', course: 'analysis', page: 'security-operations.html#analysis', difficulty: 'Intermediate', prereq: [3, 5], desc: 'Read logs, triage alerts, recognise indicators of compromise and reason from evidence to conclusions.' },
    { n: 8, title: 'Security Operations', course: 'secops', page: 'security-operations.html', difficulty: 'Intermediate', prereq: [7], desc: 'Monitoring, SIEM concepts, detection, endpoint and network visibility, and incident response workflows.' },
    { n: 9, title: 'Digital Forensics', course: 'forensics', page: 'forensics.html', difficulty: 'Intermediate', prereq: [7], desc: 'Preserve and examine evidence: metadata, file systems, timelines, memory and network artifacts.' },
    { n: 10, title: 'Advanced Cybersecurity', course: 'advanced', page: 'cybersecurity.html#advanced', difficulty: 'Advanced', prereq: [6, 8, 9], desc: 'Applied cryptography, zero trust, secure development, threat hunting and malware-analysis concepts.' }
  ];

  // Badge rules: count completed items (optionally by skill), or reach a level.
  CF.BADGES = [
    { id: 'linux-beginner', name: 'Linux Beginner', abbr: 'LX', desc: 'Complete 5 Linux lessons.', rule: { t: 'count', kind: 'lesson', skill: 'linux', n: 5 } },
    { id: 'terminal-apprentice', name: 'Terminal Apprentice', abbr: '>_', desc: 'Complete 3 terminal missions.', rule: { t: 'count', kind: 'mission', n: 3 } },
    { id: 'networking-apprentice', name: 'Networking Apprentice', abbr: 'NW', desc: 'Complete 5 networking lessons.', rule: { t: 'count', kind: 'lesson', skill: 'networking', n: 5 } },
    { id: 'kali-explorer', name: 'Kali Explorer', abbr: 'KL', desc: 'Complete 5 Kali Linux lessons.', rule: { t: 'count', kind: 'lesson', skill: 'kali', n: 5 } },
    { id: 'cyber-fundamentals', name: 'Cybersecurity Fundamentals', abbr: 'CF', desc: 'Complete 10 cybersecurity lessons.', rule: { t: 'count', kind: 'lesson', skill: 'cyber', n: 10 } },
    { id: 'web-student', name: 'Web Security Student', abbr: 'WS', desc: 'Complete 5 web security lessons.', rule: { t: 'count', kind: 'lesson', skill: 'web', n: 5 } },
    { id: 'security-analyst', name: 'Security Analyst', abbr: 'SA', desc: 'Complete 3 Security Operations labs or challenges.', rule: { t: 'count', kind: ['lab', 'challenge'], skill: 'secops', n: 3 } },
    { id: 'blue-team', name: 'Blue Team Apprentice', abbr: 'BT', desc: 'Complete 5 Security Operations lessons.', rule: { t: 'count', kind: 'lesson', skill: 'secops', n: 5 } },
    { id: 'digital-detective', name: 'Digital Detective', abbr: 'DD', desc: 'Complete a forensics lab or challenge.', rule: { t: 'count', kind: ['lab', 'challenge'], skill: 'forensics', n: 1 } },
    { id: 'forensics-beginner', name: 'Forensics Beginner', abbr: 'FB', desc: 'Complete 4 digital forensics lessons.', rule: { t: 'count', kind: 'lesson', skill: 'forensics', n: 4 } },
    { id: 'veteran', name: 'CyberForge Veteran', abbr: 'CV', desc: 'Reach level 15.', rule: { t: 'level', n: 15 } }
  ];

  CF.RANKS = ['Recruit', 'Recruit', 'Trainee', 'Trainee', 'Apprentice', 'Apprentice', 'Practitioner', 'Practitioner', 'Analyst', 'Analyst', 'Specialist', 'Specialist', 'Expert', 'Expert', 'Veteran'];
  CF.rank = (level) => CF.RANKS[Math.min(level, CF.RANKS.length) - 1] || 'Recruit';
})();
