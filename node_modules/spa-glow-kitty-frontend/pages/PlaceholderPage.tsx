import React from 'react';
import { Card } from '../components/UI';
import { Sparkles } from 'lucide-react';

export const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="h-[80vh] flex items-center justify-center animate-in fade-in">
      <Card className="text-center max-w-md w-full py-12">
        <div className="bg-surface w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-plum mb-2">Módulo: {title}</h2>
        <p className="text-plum/60 font-semibold">
          Esta sección está en construcción. ¡Pronto estará lista con más magia coquette! ✨
        </p>
      </Card>
    </div>
  );
};
