// Renders an icon image when the value is an icon path (starts with "/"),
// otherwise renders the raw emoji character as text. Used everywhere a
// question, option, or category "emoji" field is displayed, since some of
// those fields now hold an icon path instead of a plain emoji.
export default function Visual({ value, className }) {
  if (typeof value === "string" && value.startsWith("/")) {
    return <img src={value} alt="" className={className} draggable={false} />;
  }
  return <span>{value}</span>;
}
