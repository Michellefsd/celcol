import BaseCard from '../BaseCard';
import BaseHeading from '../BaseHeading';

export default function TrabajoCard() {
  return (
    <BaseCard>
      <BaseHeading>Trabajos realizados</BaseHeading>
      <div className="text-gray-500 italic">
        Aún no hay trabajos registrados.
      </div>
    </BaseCard>
  );
}
