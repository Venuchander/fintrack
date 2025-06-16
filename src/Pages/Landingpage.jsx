import React from 'react';
import { Github, TrendingUp, Shield, Zap, Users, BarChart3, Brain, Mic } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

Button
const LandingPage = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const contributors = [
    { name: "Venuchander", role: "Lead Developer", avatar: "V" },
    { name: "Suryya", role: "Full Stack Developer", avatar: "S" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">FinTrack</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-blue-600 transition-colors">
                About
              </button>
              <button onClick={() => scrollToSection('contributors')} className="text-gray-700 hover:text-blue-600 transition-colors">
                Contributors
              </button>
              <a href="https://github.com/Venuchander/fintrack" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-1">
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <a href="/login">
                    Log In
                </a>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <a href="/signup"></a>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-48 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Master Your <span className="text-blue-600">Finances</span> with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              FinTrack is a comprehensive personal finance management platform that combines intuitive tracking with AI-powered insights to help you make smarter financial decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                <a href="/signup">
                    Get Started
                </a>
              </Button>
            </div>
            
            {/* Demo GIF Placeholder */}
            <div className="max-w-5xl mx-auto pt-40">
              <div className="bg-gray-100 rounded-lg border-2 border-gray-200 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-24 w-24 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Demo GIF will be displayed here</p>
                  <p className="text-gray-500 text-sm">Showcasing FinTrack's main features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to take control of your finances</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Income & Expense Tracking</h3>
                <p className="text-gray-600">Track multiple income sources and categorize expenses with ease</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
                <p className="text-gray-600">Get personalized financial recommendations and analysis</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Mic className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Voice AI Agent</h3>
                <p className="text-gray-600">Make voice calls to your financial AI assistant</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">Your financial data is encrypted and securely stored</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About FinTrack</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              FinTrack is a comprehensive personal finance management web application that helps users track income and expenses while providing AI-powered financial insights and recommendations. Built with modern web technologies, it offers a secure and intuitive platform for managing your financial life.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Fast & Efficient</h3>
                <p className="text-gray-600">Built with React and Vite for lightning-fast performance</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Data Visualization</h3>
                <p className="text-gray-600">Interactive charts and reports to understand your finances</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
                <p className="text-gray-600">Firebase-powered security with industry best practices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section id="contributors" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The talented developers behind FinTrack</p>
          </div>
          
          <div className="flex justify-center">
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl">
              {contributors.map((contributor, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                      {contributor.avatar}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{contributor.name}</h3>
                    <p className="text-gray-600">{contributor.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <a 
              href="https://github.com/Venuchander/fintrack" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="text-lg font-medium">View on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Take Control of Your Finances?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of users who are already managing their money smarter with FinTrack</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3">
                <a href="/signup">Get Started</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <TrendingUp className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">FinTrack</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="https://github.com/Venuchander/fintrack" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 FinTrack. Built with modern web technologies for secure and efficient personal finance management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
