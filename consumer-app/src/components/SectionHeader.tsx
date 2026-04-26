interface SectionHeaderProps {
  title: string;
  more?: string;
}

export function SectionHeader({ title, more }: SectionHeaderProps) {
  return (
    <div className="section-h">
      <h3>{title}</h3>
      {more ? <span className="section-h__more">{more}</span> : null}
    </div>
  );
}
