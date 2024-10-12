'use client';

import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCcw, MoreHorizontal } from "lucide-react";

interface GiftIdea {
  name: string;
  appropriateness: string;
  relation: string;
  priceRange: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [relationship, setRelationship] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [personality, setPersonality] = useState('');
  const [budget, setBudget] = useState('');
  const [occasion, setOccasion] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [customPersonality, setCustomPersonality] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allGiftIdeas, setAllGiftIdeas] = useState<GiftIdea[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [customRelationship, setCustomRelationship] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');
  const [requestCount, setRequestCount] = useState(0);

  const resetForm = () => {
    setName('');
    setAge('');
    setGender('');
    setRelationship('');
    setHobbies('');
    setPersonality('');
    setBudget('');
    setOccasion('');
    setCustomPersonality('');
    setCustomRelationship('');
    setCustomOccasion('');
    setAllGiftIdeas([]);
    setError('');
    setShowForm(true);
    setRequestCount(0);
  };

  const extractJSONFromText = (text: string): GiftIdea[] => {
    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (error) {
          console.error("Failed to parse extracted JSON:", error);
        }
      }
  
      console.error("Failed to parse response as JSON, falling back to text processing");
  
      const sections = text.split(/(?=Gift \d:|^\d\.)/m).filter(Boolean);
  
      return sections.map((section) => {
        const lines = section.split('\n').filter(Boolean);
        return {
          name: lines[0].replace(/^(Gift \d:|^\d\.)/, '').trim(),
          appropriateness: lines[1] || "Not specified",
          relation: lines[2] || "Not specified",
          priceRange: lines[3] || "Price not specified",
        };
      });
    }
  };

  const fetchGiftIdeas = async (isShowMore: boolean = false) => {
    setLoading(true);
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const newRequestCount = requestCount + 1;
      
      const previousGifts = allGiftIdeas.map(idea => idea.name.toLowerCase());
      
      const prompt = `Generate 5 unique and creative gift ideas for:
Name: ${name}
Age: ${age}
Gender: ${gender}
Relationship: ${relationship === 'Others' ? customRelationship : relationship}
Hobbies: ${hobbies}
Personality: ${personality === 'Others' ? customPersonality : personality}
Budget: ${budget} ${currency}
Occasion: ${occasion === 'Others' ? customOccasion : occasion}

${isShowMore ? `This is request #${newRequestCount}. The following gifts have already been suggested, please provide completely different ideas:
${previousGifts.join(', ')}` : ''}

Format as JSON array:
[
  {
    "name": "Gift name",
    "appropriateness": "Why appropriate",
    "relation": "How it relates",
    "priceRange": "Price range within ${budget} ${currency}"
  }
]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const newGiftIdeas = extractJSONFromText(text);
      
      const uniqueNewGiftIdeas = newGiftIdeas.filter(newIdea => 
        !previousGifts.includes(newIdea.name.toLowerCase())
      );
      
      setAllGiftIdeas(prevIdeas => [...prevIdeas, ...uniqueNewGiftIdeas]);
      setShowForm(false);
      setRequestCount(newRequestCount);
    } catch (error) {
      console.error("Error fetching gift ideas:", error);
      setError('Failed to generate gift ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-100 p-4">
      <div className="container mx-auto">
        <h1 className="mb-6 text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800">Present AI 🎁</h1>
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-lg sm:text-xl md:text-2xl font-semibold">
              {showForm ? "Discover thoughtful gifts tailored to the recipient's personality, interests, and occasion." : "Gift Suggestions"}
            </CardTitle>
          </CardHeader>
          <div className="text-center mb-4">
            <div className="custom-line"></div>
          </div>
          <CardContent>
            {showForm ? (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Recipient&apos;s name</span>
                    <Input
                      placeholder="E.g., Sarah Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Age</span>
                    <Input
                      placeholder="E.g., 28"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Gender</span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md text-sm sm:text-base"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Relationship</span>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md text-sm sm:text-base"
                    >
                      <option value="">Select Relationship</option>
                      <option value="Friend">Friend</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Parent">Parent</option>
                      <option value="Partner">Partner</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Others">Others</option>
                    </select>
                    {relationship === 'Others' && (
                      <Input
                        placeholder="Specify relationship"
                        value={customRelationship}
                        onChange={(e) => setCustomRelationship(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                  
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Hobbies</span>
                    <Input
                      placeholder="E.g., painting, football, cooking, reading"
                      value={hobbies}
                      onChange={(e) => setHobbies(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Personality</span>
                    <select
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md text-sm sm:text-base"
                    >
                      <option value="">Select Personality</option>
                      <option value="Cheerful">Cheerful</option>
                      <option value="Introverted">Introverted</option>
                      <option value="Adventurous">Adventurous</option>
                      <option value="Creative">Creative</option>
                      <option value="Others">Others</option>
                    </select>
                    
                    {personality === 'Others' && (
                      <Input
                        placeholder="Specify personality"
                        value={customPersonality}
                        onChange={(e) => setCustomPersonality(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Budget</span>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Input
                        placeholder="E.g., 50, 100, 250"
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="flex-grow"
                      />
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-4 py-2 border rounded-md text-sm sm:text-base"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <span className="label-text text-sm sm:text-base md:text-lg font-sec">Occasion</span>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md text-sm sm:text-base"
                    >
                      <option value="">Select Occasion</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Christmas">Christmas</option>
                      <option value="Graduation">Graduation</option>
                      <option value="Others">Others</option>
                    </select>
                    {occasion === 'Others' && (
                      <Input
                        placeholder="Specify occasion"
                        value={customOccasion}
                        onChange={(e) => setCustomOccasion(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => fetchGiftIdeas(false)} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Perfect Gifts...
                    </>
                  ) : (
                    'Find Gift Ideas'
                  )}
                </Button>
                
                {error && (
                  <div className="text-red-600 mt-2 text-center">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  {allGiftIdeas.map((idea, index) => (
                    <div key={index} className="mb-4 p-4 bg-white rounded-lg shadow">
                      <h3 className="font-bold text-base sm:text-lg mb-2">Gift Idea {index + 1}</h3>
                      <div className="space-y-2 text-xs sm:text-sm md:text-base">
                        <p><strong>Gift:</strong> {idea.name}</p>
                        <p><strong>Why it&apos;s appropriate:</strong> {idea.appropriateness}</p>
                        <p><strong>How it relates:</strong> {idea.relation}</p>
                        <p><strong>Price range:</strong> {idea.priceRange}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
                  <Button 
                    onClick={() => fetchGiftIdeas(true)}
                    disabled={loading}
                    className="w-full sm:w-auto text-sm"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                    )}
                    Show More
                  </Button>
                  
                  <Button 
                    onClick={resetForm}
                    className="w-full sm:w-auto text-sm"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>  
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-800">
          <p className="flex items-center">
            <span className="text-xl">👨‍💻</span>
            <span className="ml-2 font-semibold text-sm sm:text-base">
              By <a href="https://www.instagram.com/37mohammd/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">37mohammd</a>
            </span>
          </p>
          <p className="flex items-center">
            <span className="text-xl">🌐</span>
            <span className="ml-2 font-semibold text-sm sm:text-base">
              Visit <a href="https://your-vercel-site-link.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">my Vercel Site</a>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
