"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("./config/supabase");
const agents_1 = __importDefault(require("./routes/agents"));
const questions_1 = __importDefault(require("./routes/questions"));
const answers_1 = __importDefault(require("./routes/answers"));
const users_1 = __importDefault(require("./routes/users"));
// 環境変数の読み込み
dotenv_1.default.config();
// Expressアプリケーションの作成
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
async function initializeApp() {
    try {
        console.log('🚀 Initializing QA System with LangGraph...');
        // APIルートの登録
        app.use('/api/users', users_1.default);
        app.use('/api/questions', questions_1.default);
        app.use('/api/answers', answers_1.default);
        app.use('/api/agents', agents_1.default);
        // API Endpoints
        app.get('/api/questions/pending', async (req, res) => {
            try {
                const { data, error } = await supabase_1.supabase
                    .from(supabase_1.TABLES.QUESTIONS)
                    .select(`
            *,
            answers (*)
          `)
                    .eq('status', 'pending')
                    .order('createdAt', { ascending: false });
                if (error)
                    throw error;
                res.json(data);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch pending questions' });
            }
        });
        app.post('/api/questions', async (req, res) => {
            try {
                const { content, userId } = req.body;
                const { data, error } = await supabase_1.supabase
                    .from(supabase_1.TABLES.QUESTIONS)
                    .insert({
                    content,
                    userId,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                res.json(data);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to create question' });
            }
        });
        app.get('/api/questions/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { data, error } = await supabase_1.supabase
                    .from(supabase_1.TABLES.QUESTIONS)
                    .select(`
            *,
            answers (*)
          `)
                    .eq('userId', userId)
                    .order('createdAt', { ascending: false });
                if (error)
                    throw error;
                res.json(data);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch questions' });
            }
        });
        // サーバーの起動
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 API available at http://localhost:${PORT}/api`);
            console.log('✅ QA System with LangGraph initialized and ready');
        });
    }
    catch (error) {
        console.error('❌ Failed to initialize app:', error);
        process.exit(1);
    }
}
// アプリケーションを初期化
initializeApp().catch(error => {
    console.error('❌ Unhandled error during initialization:', error);
    process.exit(1);
});
