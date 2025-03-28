"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
// Sample questions across different domains
const questions = [
    // Programming & Technology (25 questions)
    "What are the key differences between REST and GraphQL APIs?",
    "Explain the concept of dependency injection in software development.",
    "How does Docker containerization work?",
    "What are the SOLID principles in object-oriented programming?",
    "Explain the differences between SQL and NoSQL databases.",
    "What is the purpose of TypeScript and its advantages over JavaScript?",
    "How does React's Virtual DOM work?",
    "Explain the concept of microservices architecture.",
    "What are design patterns and why are they important?",
    "How does garbage collection work in modern programming languages?",
    "What is CI/CD and why is it important in modern software development?",
    "Explain the concept of serverless computing.",
    "What are WebSockets and how do they differ from HTTP?",
    "How does blockchain technology work?",
    "What is machine learning and how does it work?",
    "Explain the concept of responsive web design.",
    "What is the difference between HTTP and HTTPS?",
    "How does OAuth 2.0 authentication work?",
    "What is the purpose of a load balancer?",
    "Explain the concept of caching in web applications.",
    "What is the difference between unit testing and integration testing?",
    "How does DNS resolution work?",
    "What is the purpose of an ORM?",
    "Explain the concept of asynchronous programming.",
    "What is the difference between compiled and interpreted languages?",
    // Business & Management (25 questions)
    "What are the key components of a successful business strategy?",
    "How do you create an effective marketing plan?",
    "What is the importance of market research?",
    "Explain the concept of ROI (Return on Investment).",
    "What are the different types of organizational structures?",
    "How do you manage team conflicts effectively?",
    "What is the importance of customer feedback?",
    "How do you create a successful product launch strategy?",
    "What are the key elements of project management?",
    "How do you measure customer satisfaction?",
    "What is the importance of brand identity?",
    "How do you create an effective sales funnel?",
    "What are the key elements of risk management?",
    "How do you develop a competitive pricing strategy?",
    "What is the importance of employee engagement?",
    "How do you create an effective social media strategy?",
    "What are the key elements of change management?",
    "How do you measure business performance?",
    "What is the importance of corporate culture?",
    "How do you create an effective recruitment strategy?",
    "What are the key elements of supply chain management?",
    "How do you develop a customer retention strategy?",
    "What is the importance of financial planning?",
    "How do you create an effective business plan?",
    "What are the key elements of quality management?",
    // Science & Research (25 questions)
    "What is the theory of relativity and how does it work?",
    "Explain the process of photosynthesis.",
    "How does climate change affect ecosystems?",
    "What is quantum mechanics?",
    "How does the human immune system work?",
    "What is the role of DNA in genetics?",
    "Explain the concept of evolution.",
    "How do black holes form?",
    "What is the importance of biodiversity?",
    "How does the nervous system work?",
    "What is the role of mitochondria in cells?",
    "Explain the water cycle.",
    "How do vaccines work?",
    "What is the importance of the ozone layer?",
    "How does nuclear fusion work?",
    "What is the role of enzymes in digestion?",
    "Explain the concept of plate tectonics.",
    "How does the greenhouse effect work?",
    "What is the importance of stem cells?",
    "How does the human brain process information?",
    "What is the role of bacteria in the environment?",
    "Explain the concept of genetic engineering.",
    "How does the periodic table organize elements?",
    "What is the importance of the scientific method?",
    "How does space exploration benefit humanity?",
    // General Knowledge & Others (25 questions)
    "What are the major world religions and their key beliefs?",
    "How has globalization affected modern society?",
    "What are the key events of World War II?",
    "Explain the concept of democracy.",
    "How does the global economy work?",
    "What is the importance of cultural diversity?",
    "How has technology changed education?",
    "What are the major environmental challenges?",
    "Explain the concept of human rights.",
    "How does social media influence society?",
    "What is the role of art in culture?",
    "How has transportation evolved over time?",
    "What are the key aspects of mental health?",
    "Explain the concept of sustainable development.",
    "How does the legal system work?",
    "What is the importance of physical exercise?",
    "How has communication evolved over time?",
    "What are the key elements of critical thinking?",
    "Explain the concept of ethics.",
    "How does inflation affect the economy?",
    "What is the role of media in society?",
    "How has urbanization affected communities?",
    "What are the key aspects of nutrition?",
    "Explain the concept of social justice.",
    "How does international diplomacy work?"
];
// Sample agent specializations
const agentSpecializations = [
    {
        id: 'tech-agent',
        name: 'Tech Expert',
        description: 'Specialized in programming, software development, and technology topics',
        specialization: ['Programming', 'Technology', 'Software Development'],
        prompt_template: 'You are a technology expert. Please provide a detailed technical explanation for the following question:\n\n{question}'
    },
    {
        id: 'business-agent',
        name: 'Business Consultant',
        description: 'Specialized in business strategy, management, and marketing',
        specialization: ['Business', 'Management', 'Marketing'],
        prompt_template: 'As a business consultant, please provide strategic insights for the following question:\n\n{question}'
    },
    {
        id: 'science-agent',
        name: 'Science Researcher',
        description: 'Specialized in scientific topics, research methodology, and analysis',
        specialization: ['Science', 'Research', 'Analysis'],
        prompt_template: 'As a scientific researcher, please explain the following concept in detail:\n\n{question}'
    },
    {
        id: 'general-agent',
        name: 'Knowledge Generalist',
        description: 'Broad knowledge across various topics and domains',
        specialization: ['General Knowledge', 'Education', 'Culture'],
        prompt_template: 'Please provide a comprehensive explanation for the following question:\n\n{question}'
    }
];
async function generateTestData() {
    try {
        console.log('🚀 Starting test data generation...');
        // Create agents
        console.log('👥 Creating agents...');
        for (const agent of agentSpecializations) {
            const { error: agentError } = await supabase_1.supabase
                .from(supabase_1.TABLES.AGENTS)
                .upsert({
                id: agent.id,
                name: agent.name,
                description: agent.description,
                specialization: agent.specialization,
                prompt_template: agent.prompt_template,
                performance_score: 85 + Math.random() * 10 // Using float value between 85-95
            });
            if (agentError) {
                console.error('❌ Error creating agent:', agentError);
                continue;
            }
        }
        console.log('✅ Agents created successfully');
        // Create a demo user
        console.log('👤 Creating demo user...');
        const { data: user, error: userError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .upsert({
            name: 'Demo User',
            role: 'questioner',
            created_at: new Date().toISOString()
        })
            .select()
            .single();
        if (userError) {
            console.error('❌ Error creating user:', userError);
            return;
        }
        console.log('✅ Demo user created:', user);
        // Create questions
        console.log('❓ Creating questions...');
        for (const question of questions) {
            const { data: questionData, error: questionError } = await supabase_1.supabase
                .from(supabase_1.TABLES.QUESTIONS)
                .insert({
                content: question,
                user_id: user.id,
                status: 'pending',
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (questionError) {
                console.error('❌ Error creating question:', questionError);
                continue;
            }
            // Randomly assign an agent and create an answer
            const randomAgent = agentSpecializations[Math.floor(Math.random() * agentSpecializations.length)];
            const { error: answerError } = await supabase_1.supabase
                .from(supabase_1.TABLES.ANSWERS)
                .insert({
                question_id: questionData.id,
                content: `This is a sample answer for the question: "${question}"`,
                score: Math.floor(85 + Math.random() * 10), // Using integer value between 85-94
                agent_id: randomAgent.id,
                created_at: new Date().toISOString()
            });
            if (answerError) {
                console.error('❌ Error creating answer:', answerError);
            }
        }
        console.log('✅ Questions and answers created successfully');
        console.log('🎉 Test data generation completed!');
    }
    catch (error) {
        console.error('❌ Error generating test data:', error);
    }
}
// Run the script
generateTestData().catch(console.error);
