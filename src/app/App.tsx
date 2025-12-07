import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter basename="/vidchat">
      <Providers>
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  );
}
