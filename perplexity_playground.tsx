import React, { useState, useRef, useEffect } from 'react';
import { Search, Settings, Copy, Download, Play, History, BookOpen, Zap, Globe, Code, BarChart3, MessageSquare, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const PerplexityPlayground = () => {
  const [query, setQuery] = useState('What are the latest developments in AI safety research?');
  const [model, setModel] = useState('llama-3.1-sonar-small-128k-online');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperature, setTemperature] = useState(0.2);
  const [searchDomainFilter, setSearchDomainFilter] = useState([]);
  const [searchRecencyFilter, setSearchRecencyFilter] = useState('');
  const [returnCitations, setReturnCitations] = useState(true);
  const [returnImages, setReturnImages] = useState(false);
  const [returnRelatedQuestions, setReturnRelatedQuestions] = useState(true);
  
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('query');
  const [copySuccess, setCopySuccess] = useState('');
  
  const responseRef = useRef(null);

  const models = [
    'llama-3.1-sonar-small-128k-online',
    'llama-3.1-sonar-large-128k-online',
    'llama-3.1-sonar-huge-128k-online'
  ];

  const recencyFilters = [
    { value: '', label: 'Any time' },
    { value: 'hour', label: 'Past hour' },
    { value: 'day', label: 'Past 24 hours' },
    { value: 'week', label: 'Past week' },
    { value: 'month', label: 'Past month' },
    { value: 'year', label: 'Past year' }
  ];

  const exampleQueries = [
    "What are the latest developments in AI safety research?",
    "Compare the performance of recent large language models",
    "What are the current trends in renewable energy technology?",
    "Analyze the impact of remote work on software development productivity",
    "What are the key findings from recent climate change studies?",
    "How has the semiconductor industry evolved in 2024?"
  ];

  const makePerplexityRequest = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        return_citations: returnCitations,
        return_images: returnImages,
        return_related_questions: returnRelatedQuestions,
        messages: [
          {
            role: "user",
            content: query
          }
        ]
      };

      // Add search parameters if specified
      if (searchDomainFilter.length > 0 || searchRecencyFilter) {
        payload.search_domain_filter = searchDomainFilter;
        if (searchRecencyFilter) {
          payload.search_recency_filter = searchRecencyFilter;
        }
      }

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY_HERE'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const result = {
        id: Date.now(),
        query,
        model,
        timestamp: new Date().toISOString(),
        response: data,
        parameters: {
          maxTokens,
          temperature,
          searchDomainFilter,
          searchRecencyFilter,
          returnCitations,
          returnImages,
          returnRelatedQuestions
        }
      };
      
      setResponse(result);
      setHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      
    } catch (err) {
      console.error('API Error:', err);
      
      // For demo purposes, show a mock response
      const mockResult = {
        id: Date.now(),
        query,
        model,
        timestamp: new Date().toISOString(),
        response: {
          choices: [{
            message: {
              content: `Based on the latest research and developments, here are key findings about "${query}":\n\n**Recent Developments:**\n- Advanced safety alignment techniques are being developed by major AI labs\n- Constitutional AI methods showing promising results\n- Increased focus on interpretability and explainability\n- Growing emphasis on AI governance and policy frameworks\n\n**Key Research Areas:**\n1. **Alignment Research**: Ensuring AI systems behave according to human values\n2. **Robustness**: Making AI systems reliable under distribution shift\n3. **Interpretability**: Understanding how AI models make decisions\n4. **Governance**: Developing frameworks for responsible AI deployment\n\n**Notable Publications:**\n- Recent papers on reward modeling and RLHF improvements\n- Studies on AI system evaluation and red-teaming\n- Research on scalable oversight methods\n\nThis is a rapidly evolving field with significant progress being made across multiple dimensions of safety research.`,
              role: "assistant"
            },
            finish_reason: "stop"
          }],
          citations: [
            "https://arxiv.org/abs/2304.15004",
            "https://openai.com/research/constitutional-ai",
            "https://www.anthropic.com/research"
          ],
          related_questions: [
            "What are the main challenges in AI alignment?",
            "How do current AI safety methods compare?",
            "What role does government regulation play in AI safety?"
          ]
        },
        parameters: {
          maxTokens,
          temperature,
          searchDomainFilter,
          searchRecencyFilter,
          returnCitations,
          returnImages,
          returnRelatedQuestions
        }
      };
      
      setResponse(mockResult);
      setHistory(prev => [mockResult, ...prev.slice(0, 9)]);
      setError("Demo mode: Using mock response. To use real API, add your Perplexity API key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const downloadResponse = () => {
    if (!response) return;
    
    const dataStr = JSON.stringify(response, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perplexity-response-${response.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addDomainFilter = () => {
    const domain = prompt('Enter domain to filter (e.g., arxiv.org):');
    if (domain && !searchDomainFilter.includes(domain)) {
      setSearchDomainFilter([...searchDomainFilter, domain]);
    }
  };

  const removeDomainFilter = (domain) => {
    setSearchDomainFilter(searchDomainFilter.filter(d => d !== domain));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Perplexity API Playground
          </h1>
          <p className="text-gray-300">Experiment with AI-powered search and get real-time answers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Query & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-1">
              <div className="flex space-x-1">
                {[
                  { id: 'query', icon: Search, label: 'Query' },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                  { id: 'history', icon: History, label: 'History' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <tab.icon size={16} />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Tab */}
            {activeTab === 'query' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Query</label>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Ask anything..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Example Queries</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {exampleQueries.map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(example)}
                          className="w-full text-left p-2 bg-slate-700/50 hover:bg-slate-600 rounded border border-slate-600 text-xs transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={makePerplexityRequest}
                    disabled={loading || !query.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
                    <span>{loading ? 'Searching...' : 'Run Query'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Tokens: {maxTokens}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="100"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Temperature: {temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Search Recency</label>
                    <select
                      value={searchRecencyFilter}
                      onChange={(e) => setSearchRecencyFilter(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {recencyFilters.map(filter => (
                        <option key={filter.value} value={filter.value}>{filter.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Domain Filters</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {searchDomainFilter.map(domain => (
                        <span
                          key={domain}
                          className="bg-blue-600 text-xs px-2 py-1 rounded-full flex items-center space-x-1"
                        >
                          <span>{domain}</span>
                          <button onClick={() => removeDomainFilter(domain)} className="hover:bg-blue-700 rounded-full">×</button>
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={addDomainFilter}
                      className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded border border-slate-600"
                    >
                      + Add Domain
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={returnCitations}
                        onChange={(e) => setReturnCitations(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Return Citations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={returnImages}
                        onChange={(e) => setReturnImages(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Return Images</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={returnRelatedQuestions}
                        onChange={(e) => setReturnRelatedQuestions(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Return Related Questions</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Query History</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-gray-400 text-sm">No queries yet</p>
                  ) : (
                    history.map(item => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-600/50"
                        onClick={() => {
                          setQuery(item.query);
                          setResponse(item);
                          setActiveTab('query');
                        }}
                      >
                        <p className="text-sm font-medium truncate">{item.query}</p>
                        <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Response */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
              {/* Response Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <MessageSquare size={20} />
                  <span>Response</span>
                </h2>
                
                {response && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(response.response.choices[0].message.content)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      title="Copy response"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={downloadResponse}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      title="Download JSON"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Response Content */}
              <div className="p-6" ref={responseRef}>
                {error && (
                  <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-4 flex items-start space-x-2">
                    <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-yellow-200 font-medium">Notice</p>
                      <p className="text-yellow-100 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="animate-spin text-blue-400 mx-auto mb-4" size={32} />
                      <p className="text-gray-300">Searching the web and generating response...</p>
                    </div>
                  </div>
                )}

                {response && !loading && (
                  <div className="space-y-6">
                    {/* Main Response */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <CheckCircle className="text-green-400" size={20} />
                        <span>Answer</span>
                      </h3>
                      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                        <div className="prose prose-invert max-w-none">
                          <div className="whitespace-pre-wrap text-gray-100">
                            {response.response.choices[0].message.content}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Citations */}
                    {response.response.citations && response.response.citations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                          <BookOpen size={20} />
                          <span>Sources</span>
                        </h3>
                        <div className="space-y-2">
                          {response.response.citations.map((citation, idx) => (
                            <a
                              key={idx}
                              href={citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 bg-slate-700/30 rounded border border-slate-600 hover:bg-slate-600/30 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <Globe size={16} className="text-blue-400 flex-shrink-0" />
                                <span className="text-sm text-blue-400 hover:text-blue-300 truncate">{citation}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Questions */}
                    {response.response.related_questions && response.response.related_questions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                          <Zap size={20} />
                          <span>Related Questions</span>
                        </h3>
                        <div className="space-y-2">
                          {response.response.related_questions.map((question, idx) => (
                            <button
                              key={idx}
                              onClick={() => setQuery(question)}
                              className="block w-full text-left p-3 bg-slate-700/30 rounded border border-slate-600 hover:bg-slate-600/30 transition-colors text-sm"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <BarChart3 size={20} />
                        <span>Request Details</span>
                      </h3>
                      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Model:</span>
                            <span className="ml-2 font-mono">{response.model}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Timestamp:</span>
                            <span className="ml-2">{new Date(response.timestamp).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Temperature:</span>
                            <span className="ml-2">{response.parameters.temperature}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Max Tokens:</span>
                            <span className="ml-2">{response.parameters.maxTokens}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!response && !loading && (
                  <div className="text-center py-12">
                    <Search className="text-gray-500 mx-auto mb-4" size={48} />
                    <p className="text-gray-400">Enter a query and click "Run Query" to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {copySuccess && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {copySuccess}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerplexityPlayground;